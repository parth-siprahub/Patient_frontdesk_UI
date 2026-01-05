import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Users,
    Mic,
    MicOff,
    Play,
    Pause,
    Square,
    RefreshCw,
    Shield,
    CheckCircle2,
    Brain,
    ArrowRight,
    ArrowLeft,
    Search,
    Stethoscope,
    UserPlus
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/api";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { validateIndianPhone } from "@/components/IndianPhoneInput";

interface Patient {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
}

interface Doctor {
    id: string;
    first_name: string;
    last_name: string;
    specialization: string;
}

export default function PatientCheckIn() {
    const { toast } = useToast();
    const navigate = useNavigate();

    const [currentStep, setCurrentStep] = useState(1);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [doctorSearchQuery, setDoctorSearchQuery] = useState("");

    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [waveformData, setWaveformData] = useState<number[]>(new Array(30).fill(0.1));
    const [additionalNotes, setAdditionalNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New Patient Form State
    const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
    const [newPatientData, setNewPatientData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        age: "",
        gender: "",
    });
    const [newPatientErrors, setNewPatientErrors] = useState<any>({});

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const patientsData = await apiRequest("/users/patients");
            const doctorsData = await apiRequest("/users/doctors");
            setPatients(patientsData);
            setDoctors(doctorsData);
        } catch (error) {
            console.error("Failed to fetch data", error);
        }
    };

    const filteredPatients = patients.filter(p =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredDoctors = doctors.filter(d =>
        `${d.first_name} ${d.last_name}`.toLowerCase().includes(doctorSearchQuery.toLowerCase()) ||
        d.specialization.toLowerCase().includes(doctorSearchQuery.toLowerCase())
    );

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const updateWaveform = useCallback(() => {
        if (analyserRef.current && isRecording && !isPaused) {
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            const samples = 30;
            const blockSize = Math.floor(dataArray.length / samples);
            const newWaveform = [];
            for (let i = 0; i < samples; i++) {
                let sum = 0;
                for (let j = 0; j < blockSize; j++) {
                    sum += dataArray[i * blockSize + j];
                }
                const normalized = (sum / blockSize) / 255;
                newWaveform.push(Math.max(0.1, normalized));
            }
            setWaveformData(newWaveform);
            animationFrameRef.current = requestAnimationFrame(updateWaveform);
        }
    }, [isRecording, isPaused]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyserRef.current = analyser;
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };
            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorder.start();
            setIsRecording(true);
            setIsPaused(false);
            setRecordingTime(0);
            timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
            animationFrameRef.current = requestAnimationFrame(updateWaveform);
        } catch (error) {
            toast({ title: "Microphone error", description: "Allow access to record.", variant: "destructive" });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);
            if (timerRef.current) clearInterval(timerRef.current);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            setWaveformData(new Array(30).fill(0.3));
        }
    };

    const handleAddNewPatient = async () => {
        // Basic validation
        const errors: any = {};
        if (!newPatientData.firstName) errors.firstName = "Required";
        if (!newPatientData.lastName) errors.lastName = "Required";
        if (!newPatientData.email) errors.email = "Required";
        if (!newPatientData.age) errors.age = "Required";
        if (!newPatientData.gender) errors.gender = "Required";
        if (!newPatientData.phone) errors.phone = "Required";
        else if (!validateIndianPhone(newPatientData.phone)) errors.phone = "Invalid format";

        if (Object.keys(errors).length > 0) {
            setNewPatientErrors(errors);
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await apiRequest("/auth/signup", {
                method: "POST",
                body: JSON.stringify({
                    email: newPatientData.email,
                    password: "Welcome@123", // Default for walk-ins
                    role: "PATIENT",
                    first_name: newPatientData.firstName,
                    last_name: newPatientData.lastName,
                    phone: newPatientData.phone,
                    age: parseInt(newPatientData.age),
                    gender: newPatientData.gender,
                })
            });

            toast({ title: "Patient Registered", description: "Account created successfully." });

            // Refresh list and select new patient
            await fetchData();
            setSelectedPatientId(res.user_id);
            setIsNewPatientOpen(false);
            setNewPatientData({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                age: "",
                gender: "",
            });
            setNewPatientErrors({});
        } catch (error: any) {
            toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedPatientId || !selectedDoctorId) {
            toast({ title: "Selection Required", description: "Please select a patient and a doctor.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await apiRequest("/admin/check-in", {
                method: "POST",
                body: JSON.stringify({
                    patient_id: selectedPatientId,
                    doctor_id: selectedDoctorId,
                    notes: additionalNotes
                })
            });

            if (audioBlob) {
                const formData = new FormData();
                formData.append("file", audioBlob, "symptoms.webm");
                await apiRequest(`/consultations/${res.consultation_id}/upload`, {
                    method: "POST",
                    headers: {},
                    body: formData
                });
            }

            toast({ title: "Success", description: "Patient checked in successfully." });
            navigate("/admin/dashboard");
        } catch (error: any) {
            toast({ title: "Check-in Failed", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-foreground">Patient Check-in</h1>
                <p className="text-muted-foreground">Register a patient's arrival and record symptoms.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Step 1: Patient Selection */}
                <Card className="border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Select Patient
                        </CardTitle>

                        <Dialog open={isNewPatientOpen} onOpenChange={setIsNewPatientOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <UserPlus className="h-4 w-4" />
                                    New Patient
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Register New Patient</DialogTitle>
                                    <DialogDescription>
                                        Add details for a walk-in patient. A temporary account will be created.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">First Name</Label>
                                            <Input
                                                id="firstName"
                                                value={newPatientData.firstName}
                                                onChange={(e) => setNewPatientData({ ...newPatientData, firstName: e.target.value })}
                                                className={newPatientErrors.firstName ? "border-destructive" : ""}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">Last Name</Label>
                                            <Input
                                                id="lastName"
                                                value={newPatientData.lastName}
                                                onChange={(e) => setNewPatientData({ ...newPatientData, lastName: e.target.value })}
                                                className={newPatientErrors.lastName ? "border-destructive" : ""}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new-email">Email</Label>
                                        <Input
                                            id="new-email"
                                            type="email"
                                            value={newPatientData.email}
                                            onChange={(e) => setNewPatientData({ ...newPatientData, email: e.target.value })}
                                            className={newPatientErrors.email ? "border-destructive" : ""}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="new-age">Age</Label>
                                            <Input
                                                id="new-age"
                                                type="number"
                                                value={newPatientData.age}
                                                onChange={(e) => setNewPatientData({ ...newPatientData, age: e.target.value })}
                                                className={newPatientErrors.age ? "border-destructive" : ""}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="new-gender">Gender</Label>
                                            <Select
                                                value={newPatientData.gender}
                                                onValueChange={(val) => setNewPatientData({ ...newPatientData, gender: val })}
                                            >
                                                <SelectTrigger className={newPatientErrors.gender ? "border-destructive" : ""}>
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card">
                                                    <SelectItem value="male">Male</SelectItem>
                                                    <SelectItem value="female">Female</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new-phone">Phone Number (+91)</Label>
                                        <Input
                                            id="new-phone"
                                            placeholder="9876543210"
                                            value={newPatientData.phone}
                                            onChange={(e) => setNewPatientData({ ...newPatientData, phone: e.target.value })}
                                            className={newPatientErrors.phone ? "border-destructive" : ""}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleAddNewPatient} disabled={isSubmitting}>
                                        {isSubmitting ? <RefreshCw className="animate-spin mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                        Register Patient
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                placeholder="Search patient..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-2 bg-muted/10">
                            {filteredPatients.length > 0 ? filteredPatients.map(p => (
                                <div
                                    key={p.id}
                                    className={cn(
                                        "p-3 rounded-md cursor-pointer transition-all border border-transparent hover:bg-accent",
                                        selectedPatientId === p.id ? "bg-primary/10 border-primary/20 shadow-sm" : ""
                                    )}
                                    onClick={() => setSelectedPatientId(p.id)}
                                >
                                    <p className="font-medium text-foreground">{p.first_name} {p.last_name}</p>
                                    <p className="text-xs text-muted-foreground">{p.email}</p>
                                </div>
                            )) : (
                                <p className="text-center py-4 text-sm text-muted-foreground">No patients found.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Step 2: Doctor Selection */}
                <Card className="border-border/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Stethoscope className="h-5 w-5 text-primary" />
                            Assign Doctor
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                placeholder="Search doctor..."
                                value={doctorSearchQuery}
                                onChange={(e) => setDoctorSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-2 border rounded-md p-2 bg-muted/10">
                            {filteredDoctors.length > 0 ? filteredDoctors.map(d => (
                                <div
                                    key={d.id}
                                    className={cn(
                                        "p-3 rounded-md cursor-pointer transition-all border border-transparent hover:bg-accent",
                                        selectedDoctorId === d.id ? "bg-secondary/20 border-secondary/30 shadow-sm" : ""
                                    )}
                                    onClick={() => setSelectedDoctorId(d.id)}
                                >
                                    <p className="font-medium text-foreground">Dr. {d.first_name} {d.last_name}</p>
                                    <p className="text-xs text-muted-foreground">{d.specialization}</p>
                                </div>
                            )) : (
                                <p className="text-center py-4 text-sm text-muted-foreground">No doctors available.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Step 3: Recording Symptoms */}
            <Card className="border-border/50 bg-card shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mic className="h-5 w-5 text-primary" />
                        Symptom Intake
                    </CardTitle>
                    <CardDescription>Record the patient's description of their symptoms for AI triage.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-muted/30 rounded-2xl p-8 space-y-4 border border-border/50">
                        <div className="w-full h-16 flex items-center justify-center gap-1.5">
                            {waveformData.map((h, i) => (
                                <div
                                    key={i}
                                    className={cn("w-2 rounded-full transition-all duration-75", isRecording ? "bg-primary" : "bg-muted-foreground/20")}
                                    style={{ height: `${h * 64}px`, minHeight: '6px' }}
                                />
                            ))}
                        </div>
                        <div className="text-center font-mono text-3xl font-bold text-foreground">{formatTime(recordingTime)}</div>
                        <div className="flex justify-center gap-6">
                            {!isRecording && !audioBlob && (
                                <Button onClick={startRecording} className="rounded-full w-16 h-16 shadow-lg hover:scale-105 transition-transform"><Mic className="h-6 w-6" /></Button>
                            )}
                            {isRecording && (
                                <Button onClick={stopRecording} variant="destructive" className="rounded-full w-16 h-16 shadow-lg animate-pulse"><Square className="h-6 w-6" /></Button>
                            )}
                            {audioBlob && (
                                <div className="flex gap-3">
                                    <Button onClick={() => { setAudioBlob(null); setAudioUrl(null); setRecordingTime(0); }} variant="outline" className="rounded-full px-6">Re-record</Button>
                                </div>
                            )}
                        </div>
                        <p className="text-center text-xs text-muted-foreground">
                            {isRecording ? "Listening to patient..." : audioBlob ? "Recording ready for submission" : "Tap icon to start recording"}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Staff Observation / Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Enter any visual observations or additional details..."
                            value={additionalNotes}
                            onChange={(e) => setAdditionalNotes(e.target.value)}
                            className="resize-none h-24"
                        />
                    </div>
                    <Button
                        className="w-full h-14 text-lg font-semibold shadow-md"
                        size="lg"
                        disabled={isSubmitting || !selectedPatientId || !selectedDoctorId}
                        onClick={handleSubmit}
                    >
                        {isSubmitting ? <RefreshCw className="animate-spin mr-2 h-5 w-5" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                        Complete Patient Check-in
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
