import { useState } from "react";
import { format } from "date-fns";
import { Calendar, CheckCircle2, Clock, Play, Pause, FileText, Brain, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface Consultation {
  id: string;
  date: Date;
  doctorName: string;
  doctorSpecialty: string;
  doctorImage: string;
  status: "completed" | "upcoming";
  hasAudio: boolean;
  audioDuration?: number;
  aiSummary?: string;
  doctorNotes?: string;
  symptoms?: string;
}

const consultations: Consultation[] = [
  {
    id: "1",
    date: new Date(2024, 11, 28, 10, 30),
    doctorName: "Dr. Ananya Sharma",
    doctorSpecialty: "Neurologist",
    doctorImage: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face",
    status: "completed",
    hasAudio: true,
    audioDuration: 185,
    symptoms: "Recurring headaches, difficulty concentrating, occasional dizziness",
    aiSummary: "Patient presented with recurring tension headaches occurring 3-4 times per week over the past month. Symptoms include bilateral pressure-type pain, difficulty concentrating during episodes, and occasional mild dizziness. No visual disturbances or nausea reported.",
    doctorNotes: "Diagnosis: Tension-type headache, likely stress-related.\n\nRecommendations:\n1. Lifestyle modifications - regular sleep schedule, stress management\n2. Over-the-counter pain relief as needed\n3. Consider keeping a headache diary\n4. Follow-up in 4 weeks if symptoms persist"
  },
  {
    id: "2",
    date: new Date(2024, 11, 15, 14, 0),
    doctorName: "Dr. Rohan Mehta",
    doctorSpecialty: "Neurologist",
    doctorImage: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face",
    status: "completed",
    hasAudio: true,
    audioDuration: 240,
    symptoms: "Numbness in hands, tingling sensations, muscle weakness",
    aiSummary: "Patient reported intermittent numbness and tingling in both hands, primarily in the morning. Associated with mild grip weakness. Symptoms have been present for approximately 2 weeks.",
    doctorNotes: "Assessment: Carpal tunnel syndrome suspected.\n\nPlan:\n1. Nerve conduction study recommended\n2. Wrist splints for nighttime use\n3. Ergonomic assessment at workplace\n4. Follow-up in 3 weeks"
  },
  {
    id: "3",
    date: new Date(2025, 0, 8, 10, 30),
    doctorName: "Dr. Ananya Sharma",
    doctorSpecialty: "Neurologist",
    doctorImage: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face",
    status: "upcoming",
    hasAudio: false,
    symptoms: "Follow-up consultation for headache management"
  },
  {
    id: "4",
    date: new Date(2024, 10, 20, 9, 0),
    doctorName: "Dr. Kavita Nair",
    doctorSpecialty: "Neurologist",
    doctorImage: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=150&h=150&fit=crop&crop=face",
    status: "completed",
    hasAudio: false,
    symptoms: "Sleep disturbances, difficulty falling asleep, daytime fatigue",
    aiSummary: "Patient discussed ongoing difficulties with sleep initiation and maintenance. Reports taking 45+ minutes to fall asleep and waking 2-3 times nightly. Daytime fatigue affecting work performance.",
    doctorNotes: "Initial evaluation for insomnia.\n\nRecommendations:\n1. Sleep hygiene education provided\n2. Limit screen time 1 hour before bed\n3. Consider melatonin 3mg before bedtime"
  }
];

export default function PastConsultations() {
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Past Consultations</h1>
        <p className="text-muted-foreground">
          View your neurology consultation history
        </p>
      </div>

      {/* Consultations List */}
      <div className="space-y-4">
        {consultations.map((consultation) => (
          <Card 
            key={consultation.id} 
            className={cn(
              "border-border/50 hover:shadow-md transition-all cursor-pointer",
              consultation.status === "upcoming" && "border-primary/30 bg-primary/5"
            )}
            onClick={() => setSelectedConsultation(consultation)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Doctor Image */}
                <img
                  src={consultation.doctorImage}
                  alt={consultation.doctorName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-border"
                />

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">{consultation.doctorName}</h3>
                    <Badge 
                      variant={consultation.status === "completed" ? "secondary" : "default"}
                      className="shrink-0"
                    >
                      {consultation.status === "completed" ? (
                        <><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</>
                      ) : (
                        <><Clock className="h-3 w-3 mr-1" /> Upcoming</>
                      )}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{consultation.doctorSpecialty}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(consultation.date, "d MMM yyyy")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {format(consultation.date, "h:mm a")} IST
                    </span>
                    {consultation.hasAudio && (
                      <Badge variant="outline" className="text-xs">
                        <Play className="h-3 w-3 mr-1" /> Recording
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedConsultation} onOpenChange={() => setSelectedConsultation(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0">
          {selectedConsultation && (
            <>
              <DialogHeader className="p-6 pb-4">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedConsultation.doctorImage}
                    alt={selectedConsultation.doctorName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                  />
                  <div>
                    <DialogTitle className="text-xl">{selectedConsultation.doctorName}</DialogTitle>
                    <DialogDescription className="mt-1">
                      {selectedConsultation.doctorSpecialty} • {format(selectedConsultation.date, "d MMMM yyyy 'at' h:mm a")} IST
                    </DialogDescription>
                    <Badge 
                      variant={selectedConsultation.status === "completed" ? "secondary" : "default"}
                      className="mt-2"
                    >
                      {selectedConsultation.status === "completed" ? "Completed" : "Upcoming"}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              <ScrollArea className="max-h-[60vh]">
                <div className="px-6 pb-6 space-y-6">
                  {/* Symptoms */}
                  {selectedConsultation.symptoms && (
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2 text-foreground">
                        <FileText className="h-4 w-4 text-primary" />
                        Reported Symptoms
                      </h4>
                      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                        {selectedConsultation.symptoms}
                      </p>
                    </div>
                  )}

                  {/* Audio Playback */}
                  {selectedConsultation.hasAudio && selectedConsultation.audioDuration && (
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2 text-foreground">
                        <Play className="h-4 w-4 text-primary" />
                        Consultation Recording
                      </h4>
                      <Card className="border-border/50 bg-muted/30">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <Button
                              size="icon"
                              variant={isPlaying ? "secondary" : "default"}
                              className="w-12 h-12 rounded-full shrink-0"
                              onClick={togglePlayback}
                            >
                              {isPlaying ? (
                                <Pause className="h-5 w-5" />
                              ) : (
                                <Play className="h-5 w-5 ml-0.5" />
                              )}
                            </Button>
                            <div className="flex-1 space-y-2">
                              <Slider
                                value={[audioProgress]}
                                onValueChange={([value]) => setAudioProgress(value)}
                                max={100}
                                step={1}
                                className="w-full"
                              />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{formatDuration(Math.floor(audioProgress * selectedConsultation.audioDuration / 100))}</span>
                                <span>{formatDuration(selectedConsultation.audioDuration)}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  <Separator />

                  {/* AI Summary */}
                  {selectedConsultation.aiSummary && (
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2 text-foreground">
                        <Brain className="h-4 w-4 text-primary" />
                        AI-Generated Summary
                      </h4>
                      <Card className="border-primary/20 bg-primary/5">
                        <CardContent className="p-4">
                          <p className="text-sm text-foreground leading-relaxed">
                            {selectedConsultation.aiSummary}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Doctor Notes */}
                  {selectedConsultation.doctorNotes && (
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2 text-foreground">
                        <FileText className="h-4 w-4 text-primary" />
                        Doctor's Notes
                      </h4>
                      <Card className="border-border/50">
                        <CardContent className="p-4">
                          <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                            {selectedConsultation.doctorNotes}
                          </pre>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Upcoming appointment message */}
                  {selectedConsultation.status === "upcoming" && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">This appointment is upcoming</p>
                      <p className="text-sm">Notes will be available after the consultation.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
