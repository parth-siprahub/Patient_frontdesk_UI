import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriorityChip } from "@/components/PriorityChip";
import { WaitTimer } from "@/components/WaitTimer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Phone, Users, AlertTriangle, CheckCircle, UserPlus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

const doctors = [
  { id: "1", name: "Dr. Ananya Sharma", specialization: "Neurology" },
  { id: "2", name: "Dr. Rohan Mehta", specialization: "Neurology" },
  { id: "3", name: "Dr. Kavita Nair", specialization: "Neurology" },
];

interface TriagePatient {
  id: string;
  appointment_id: string;
  name: string;
  phone: string;
  triageScore: number;
  symptoms: string;
  checkInTime: Date;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [patients, setPatients] = useState<TriagePatient[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<TriagePatient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const queueData = await apiRequest("/admin/triage_queue");
        const mappedQueue = queueData.map((p: any) => ({
          ...p,
          checkInTime: new Date(p.checkInTime)
        }));
        setPatients(mappedQueue);

        const doctorsData = await apiRequest("/users/doctors");
        setDoctors(doctorsData);
      } catch (error) {
        toast({
          title: "Error fetching data",
          description: "Failed to load triage queue or doctors",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();

    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const criticalCount = patients.filter(p => p.triageScore <= 3).length;
  const stableCount = patients.filter(p => p.triageScore > 3).length;
  const totalPatients = patients.length;

  const handleAssignClick = (patient: TriagePatient) => {
    setSelectedPatient(patient);
    setSelectedDoctor("");
    setAssignDialogOpen(true);
  };

  const handleAssignDoctor = async () => {
    if (!selectedPatient || !selectedDoctor) return;

    try {
      await apiRequest(`/admin/assign/${selectedPatient.appointment_id}`, {
        method: "PATCH",
        body: JSON.stringify({ doctor_id: selectedDoctor })
      });

      const doctor = doctors.find(d => d.id === selectedDoctor);
      setPatients(prev => prev.filter(p => p.id !== selectedPatient.id));

      toast({
        title: "Patient Assigned",
        description: `${selectedPatient.name} has been assigned to Dr. ${doctor.last_name || doctor.name}`,
      });
    } catch (error: any) {
      toast({
        title: "Assignment Failed",
        description: error.message,
        variant: "destructive"
      });
    }

    setAssignDialogOpen(false);
    setSelectedPatient(null);
    setSelectedDoctor("");
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total in Queue</p>
              <p className="text-2xl font-semibold text-foreground">{totalPatients}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Critical Cases</p>
              <p className="text-2xl font-semibold text-foreground">{criticalCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Stable Cases</p>
              <p className="text-2xl font-semibold text-foreground">{stableCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Triage Queue Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Live Triage Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-semibold text-foreground">Priority</TableHead>
                  <TableHead className="font-semibold text-foreground">Patient</TableHead>
                  <TableHead className="font-semibold text-foreground">AI Intake Summary</TableHead>
                  <TableHead className="font-semibold text-foreground">Wait Time</TableHead>
                  <TableHead className="font-semibold text-foreground text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow
                    key={patient.id}
                    className="hover:bg-accent/50 transition-colors"
                  >
                    <TableCell>
                      <PriorityChip triageScore={patient.triageScore} />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{patient.name}</p>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          <span className="text-sm">{patient.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {patient.symptoms}
                      </p>
                    </TableCell>
                    <TableCell>
                      <WaitTimer checkInTime={patient.checkInTime} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAssignClick(patient)}
                        className="gap-1.5"
                      >
                        <UserPlus className="h-4 w-4" />
                        Assign to Doctor
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Assign to Doctor Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign to Doctor</DialogTitle>
            <DialogDescription>
              {selectedPatient && (
                <>Assign <span className="font-medium text-foreground">{selectedPatient.name}</span> to a doctor.</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Select Doctor</label>
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a doctor" />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border z-50">
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      <div className="flex flex-col">
                        <span>{doctor.name}</span>
                        <span className="text-xs text-muted-foreground">{doctor.specialization}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignDoctor} disabled={!selectedDoctor}>
                Assign Patient
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
