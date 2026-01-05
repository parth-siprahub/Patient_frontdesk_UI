import { useState, useRef, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
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
  ArrowLeft
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const timeSlots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM"
];

const doctorInfo = {
  name: "Dr. Ananya Sharma",
  specialization: "Neurologist",
  location: "NeuroAssist Clinic, Bengaluru",
  image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face",
};

export default function BookAppointment() {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Step State (1 = Date & Time, 2 = Record Symptoms)
  const [currentStep, setCurrentStep] = useState(1);
  
  // Date & Time State
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>(new Array(30).fill(0.1));
  const [additionalNotes, setAdditionalNotes] = useState("");
  
  // Booking State
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isStep1Complete = date && selectedTime;

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
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
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
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
      
    } catch (error) {
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to record your symptoms.",
        variant: "destructive",
      });
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
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

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
    setIsPaused(false);
    setWaveformData(new Array(30).fill(0.1));
  };

  const handleConfirmDateTime = () => {
    if (isStep1Complete) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const generateBookingId = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `NA-${year}-${randomNum}`;
  };

  const handleSubmitSymptoms = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const bookingData = {
      date: date!,
      time: selectedTime!,
      doctorName: doctorInfo.name,
      specialization: doctorInfo.specialization,
      location: doctorInfo.location,
      audioUrl: audioUrl || undefined,
      notes: additionalNotes || undefined,
      bookingId: generateBookingId(),
    };
    
    setIsSubmitting(false);
    navigate("/dashboard/appointment-confirmed", { 
      state: { bookingData },
      replace: true // Prevent back navigation to booking form
    });
  };

  useEffect(() => {
    if (audioUrl) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-8">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-primary">
          <Brain className="h-8 w-8" />
          <span className="text-2xl font-bold">NeuroAssist</span>
        </div>
        
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
            currentStep === 1 
              ? "bg-primary text-primary-foreground" 
              : "bg-primary/10 text-primary"
          )}>
            <CalendarIcon className="h-4 w-4" />
            <span>Date & Time</span>
          </div>
          <div className="w-8 h-0.5 bg-border" />
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
            currentStep === 2 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted text-muted-foreground"
          )}>
            <Mic className="h-4 w-4" />
            <span>Record Symptoms</span>
          </div>
        </div>
      </div>

      {/* STEP 1: Date & Time Selection */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Book Appointment</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Select your preferred date and time for your neurology consultation.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Date Selection */}
              <Card className="border-border/50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    Select Date
                  </CardTitle>
                  <CardDescription>Choose a date for your appointment (only future dates)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(d) => d < new Date() || d.getDay() === 0}
                      className="rounded-xl border border-border/50 pointer-events-auto"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Time Slot Selection */}
              <Card className="border-border/50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Clock className="h-5 w-5 text-primary" />
                    Select Time Slot (IST)
                  </CardTitle>
                  <CardDescription>
                    {date 
                      ? `Available slots for ${format(date, "d MMMM yyyy")}` 
                      : "Please select a date first"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {timeSlots.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        className={cn(
                          "h-12 transition-all font-medium",
                          selectedTime === time && "ring-2 ring-primary/20 shadow-md"
                        )}
                        onClick={() => setSelectedTime(time)}
                        disabled={!date}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        {time}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Doctor Info */}
              <Card className="border-border/50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Brain className="h-5 w-5 text-primary" />
                    Your Specialist
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-5 p-4 bg-muted/30 rounded-xl">
                    <img
                      src={doctorInfo.image}
                      alt={doctorInfo.name}
                      className="w-16 h-16 rounded-full object-cover border-4 border-primary/10"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{doctorInfo.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="font-normal">
                          <Brain className="h-3 w-3 mr-1" />
                          {doctorInfo.specialization}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {doctorInfo.location}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Summary */}
            <div>
              <Card className="border-border/50 sticky top-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Selected Appointment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium text-foreground">
                        {date ? format(date, "d MMM yyyy") : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Time (IST)</span>
                      <span className="font-medium text-foreground">
                        {selectedTime || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Doctor</span>
                      <span className="font-medium text-foreground">{doctorInfo.name}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <Button 
                    className="w-full h-12" 
                    disabled={!isStep1Complete}
                    onClick={handleConfirmDateTime}
                  >
                    Confirm Date & Time
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  
                  {!isStep1Complete && (
                    <p className="text-xs text-muted-foreground text-center">
                      Please select both date and time to continue
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Record Symptoms */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Describe Your Symptoms</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Please record or type your symptoms clearly. This will help your doctor prepare for the consultation.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Recording */}
            <div className="lg:col-span-2 space-y-6">
              {/* Appointment Summary */}
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    Appointment Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Date</span>
                      <p className="font-medium text-foreground">{date && format(date, "d MMM yyyy")}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Time (IST)</span>
                      <p className="font-medium text-foreground">{selectedTime}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Doctor</span>
                      <p className="font-medium text-foreground">{doctorInfo.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Voice Recording Section */}
              <Card className="border-border/50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Mic className="h-5 w-5 text-primary" />
                    Voice Recording
                  </CardTitle>
                  <CardDescription>
                    Record your symptoms using your voice
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-muted/30 rounded-xl p-6 space-y-5">
                    {/* Waveform Visualization */}
                    <div className="w-full h-16 flex items-center justify-center gap-1">
                      {waveformData.map((height, index) => (
                        <div
                          key={index}
                          className={cn(
                            "w-1.5 rounded-full transition-all duration-75",
                            isRecording && !isPaused
                              ? 'bg-primary' 
                              : audioBlob 
                                ? 'bg-primary/60' 
                                : 'bg-muted-foreground/20'
                          )}
                          style={{
                            height: `${height * 60}px`,
                            minHeight: '6px',
                          }}
                        />
                      ))}
                    </div>

                    {/* Timer */}
                    <div className="text-center">
                      <span className="text-3xl font-mono font-semibold text-foreground">
                        {formatTime(recordingTime)}
                      </span>
                      {isRecording && isPaused && (
                        <span className="ml-2 text-sm text-muted-foreground">(Paused)</span>
                      )}
                    </div>

                    {/* Recording Controls */}
                    <div className="flex justify-center gap-4">
                      {!audioBlob ? (
                        <>
                          {!isRecording ? (
                            <Button
                              size="lg"
                              className="w-20 h-20 rounded-full hover:scale-105 shadow-lg shadow-primary/20"
                              onClick={startRecording}
                            >
                              <Mic className="h-8 w-8" />
                            </Button>
                          ) : (
                            <>
                              {isPaused ? (
                                <Button
                                  size="lg"
                                  variant="outline"
                                  className="w-14 h-14 rounded-full"
                                  onClick={resumeRecording}
                                >
                                  <Play className="h-5 w-5 ml-0.5" />
                                </Button>
                              ) : (
                                <Button
                                  size="lg"
                                  variant="outline"
                                  className="w-14 h-14 rounded-full"
                                  onClick={pauseRecording}
                                >
                                  <Pause className="h-5 w-5" />
                                </Button>
                              )}
                              <Button
                                size="lg"
                                variant="destructive"
                                className="w-14 h-14 rounded-full"
                                onClick={stopRecording}
                              >
                                <Square className="h-5 w-5" />
                              </Button>
                            </>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-4">
                          <Button
                            size="lg"
                            variant="outline"
                            className="w-14 h-14 rounded-full"
                            onClick={togglePlayback}
                          >
                            {isPlaying ? (
                              <Pause className="h-5 w-5" />
                            ) : (
                              <Play className="h-5 w-5 ml-0.5" />
                            )}
                          </Button>
                          <Button
                            size="lg"
                            variant="ghost"
                            className="w-14 h-14 rounded-full"
                            onClick={resetRecording}
                          >
                            <RefreshCw className="h-5 w-5" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Status Text */}
                    <p className="text-center text-sm text-muted-foreground">
                      {isRecording && !isPaused
                        ? "Recording... Tap pause or stop" 
                        : isRecording && isPaused
                          ? "Paused. Tap play to resume or stop to finish."
                          : audioBlob 
                            ? "Recording complete. Play to review or re-record."
                            : "Tap the microphone to start recording"
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Text Input */}
              <Card className="border-border/50">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl">Additional Notes (Optional)</CardTitle>
                  <CardDescription>
                    Type any additional details about your symptoms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Example: I have been experiencing frequent headaches and dizziness for the past few days."
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Actions */}
            <div className="space-y-6">
              <Card className="border-border/50 sticky top-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Ready to Submit?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground bg-primary/5 rounded-lg p-3">
                    <Shield className="h-5 w-5 text-primary flex-shrink-0" />
                    <p>Your recording and notes are securely stored.</p>
                  </div>
                  
                  <Button 
                    className="w-full h-12" 
                    onClick={handleSubmitSymptoms}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Booking...
                      </>
                    ) : (
                      <>
                        Submit Symptoms
                        <CheckCircle2 className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full h-10" 
                    onClick={handleBack}
                    disabled={isSubmitting}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Date & Time
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
