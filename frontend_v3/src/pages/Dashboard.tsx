import { Calendar, FileText, Clock, Stethoscope, Brain, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

const quickActions = [
  {
    title: "Book Appointment",
    description: "Schedule a consultation and describe your symptoms",
    icon: Calendar,
    href: "/dashboard/appointments",
    primary: true,
  },
  {
    title: "View Past Reports",
    description: "Access your medical history and consultation records",
    icon: FileText,
    href: "/dashboard/consultations",
    primary: false,
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const displayName = user?.firstName || "there";

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Welcome Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-primary" />
          <span className="text-xl font-semibold text-primary">NeuroAssist</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground mt-4">
          Hello, {displayName} 👋
        </h1>
        <p className="text-muted-foreground">
          Welcome back to your health dashboard. How can we help you today?
        </p>
      </div>

      {/* Quick Actions */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {quickActions.map((action) => (
            <Card 
              key={action.title}
              className={`transition-all hover:shadow-lg hover:-translate-y-1 ${
                action.primary 
                  ? "border-primary/30 bg-primary/5" 
                  : "border-border/50"
              }`}
            >
              <CardHeader className="pb-3">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-3 ${
                  action.primary 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-accent text-accent-foreground"
                }`}>
                  <action.icon className="h-7 w-7" />
                </div>
                <CardTitle className="text-xl">{action.title}</CardTitle>
                <CardDescription className="text-base">{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  asChild 
                  variant={action.primary ? "default" : "outline"} 
                  className="w-full h-11"
                >
                  <Link to={action.href} className="flex items-center gap-2">
                    {action.primary ? "Book Now" : "View Reports"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Info Widgets */}
      <section className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Appointment */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center gap-4 pb-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Upcoming Appointment</CardTitle>
              <CardDescription>Your next scheduled visit</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-accent/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=80&h=80&fit=crop&crop=face"
                    alt="Dr. Ananya Sharma"
                    className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
                  />
                  <div>
                    <p className="font-medium text-foreground">Dr. Ananya Sharma</p>
                    <p className="text-sm text-muted-foreground">Neurology</p>
                  </div>
                </div>
                <Badge variant="secondary">Confirmed</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-primary font-medium">
                <Calendar className="h-4 w-4" />
                <span>8 Jan 2025 at 10:30 AM IST</span>
              </div>
              <p className="text-sm text-muted-foreground">
                NeuroAssist Clinic, Bengaluru
              </p>
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link to="/dashboard/appointments">Manage Appointments</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Last Consultation Summary */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center gap-4 pb-3">
            <div className="w-12 h-12 rounded-xl bg-secondary/80 flex items-center justify-center">
              <Stethoscope className="h-6 w-6 text-secondary-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">Last Consultation</CardTitle>
              <CardDescription>Summary from your recent visit</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-accent/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-foreground">28 Dec 2024</p>
                <Badge variant="outline">Completed</Badge>
              </div>
              <p className="text-sm text-foreground font-medium">Dr. Ananya Sharma</p>
              <p className="text-sm text-muted-foreground">
                Tension-type headache assessment completed. Lifestyle modifications recommended. 
                Follow-up scheduled for symptom review.
              </p>
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link to="/dashboard/consultations">View All Consultations</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
