import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { 
  CheckCircle2, 
  Calendar, 
  Clock, 
  MapPin, 
  Brain, 
  Play, 
  Pause,
  FileText,
  ArrowRight,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";

interface BookingData {
  date: Date;
  time: string;
  doctorName: string;
  specialization: string;
  location: string;
  audioUrl?: string;
  notes?: string;
  bookingId: string;
}

export default function AppointmentConfirmed() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  
  // Get booking data from navigation state or sessionStorage
  const [bookingData, setBookingData] = useState<BookingData | null>(null);

  useEffect(() => {
    // Try to get from navigation state first
    if (location.state?.bookingData) {
      setBookingData(location.state.bookingData);
      // Store in sessionStorage for refresh persistence
      sessionStorage.setItem('lastBooking', JSON.stringify({
        ...location.state.bookingData,
        date: location.state.bookingData.date.toISOString()
      }));
    } else {
      // Try to recover from sessionStorage
      const stored = sessionStorage.getItem('lastBooking');
      if (stored) {
        const parsed = JSON.parse(stored);
        setBookingData({
          ...parsed,
          date: new Date(parsed.date)
        });
      } else {
        // No booking data, redirect to dashboard
        navigate('/dashboard');
      }
    }
  }, [location.state, navigate]);

  useEffect(() => {
    if (bookingData?.audioUrl) {
      const audioElement = new Audio(bookingData.audioUrl);
      audioElement.onended = () => setIsPlaying(false);
      setAudio(audioElement);
    }
    return () => {
      if (audio) {
        audio.pause();
      }
    };
  }, [bookingData?.audioUrl]);

  const togglePlayback = () => {
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const displayName = user?.firstName || "Patient";

  if (!bookingData) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-8">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Appointment Confirmed ✅
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your neurology appointment has been successfully scheduled.
          </p>
        </div>
      </div>

      {/* Confirmation Summary */}
      <Card className="border-green-200 dark:border-green-800/50 bg-green-50/50 dark:bg-green-900/10">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-5 w-5 text-primary" />
            Confirmation Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Patient Name</span>
              <p className="font-medium text-foreground">{displayName}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Booking ID</span>
              <p className="font-mono font-medium text-primary">{bookingData.bookingId}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Doctor</span>
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">{bookingData.doctorName}</p>
                <Badge variant="secondary" className="text-xs">
                  <Brain className="h-3 w-3 mr-1" />
                  {bookingData.specialization}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Location</span>
              <p className="font-medium text-foreground flex items-center gap-1">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {bookingData.location}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Date</span>
              <p className="font-medium text-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {format(bookingData.date, "EEEE, d MMMM yyyy")}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Time (IST)</span>
              <p className="font-medium text-foreground flex items-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {bookingData.time}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Symptom Summary */}
      {(bookingData.audioUrl || bookingData.notes) && (
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5 text-primary" />
              Your Submitted Symptoms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {bookingData.audioUrl && (
              <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Voice Recording</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full h-10 w-10 p-0"
                    onClick={togglePlayback}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4 ml-0.5" />
                    )}
                  </Button>
                </div>
                <div className="w-full h-8 flex items-center justify-center gap-0.5">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full bg-primary/40"
                      style={{
                        height: `${Math.random() * 24 + 8}px`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {bookingData.notes && (
              <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                <span className="text-sm font-medium text-foreground">Additional Notes</span>
                <p className="text-sm text-muted-foreground">{bookingData.notes}</p>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4 flex-shrink-0" />
              <p>Your doctor will review this before the consultation.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary">1</span>
              </div>
              <p className="text-foreground">Please arrive 10 minutes before your appointment</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary">2</span>
              </div>
              <p className="text-foreground">Carry any previous medical reports if available</p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary">3</span>
              </div>
              <p className="text-foreground">You will receive reminders before your appointment</p>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild className="flex-1 h-12">
          <Link to="/dashboard">
            Go to Dashboard
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="flex-1 h-12">
          <Link to="/dashboard/consultations">
            View My Appointments
          </Link>
        </Button>
      </div>
    </div>
  );
}
