import { Card, CardContent } from "@/components/ui/card";
import { Mic, Calendar, Shield } from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Voice-Based Symptom Recording",
    description: "Simply speak your symptoms and our AI will accurately transcribe and analyze them, making it easier than ever to communicate with your healthcare provider."
  },
  {
    icon: Calendar,
    title: "Smart Appointment Booking",
    description: "Book appointments with the right specialists based on your symptoms. Our intelligent system matches you with available doctors in your area."
  },
  {
    icon: Shield,
    title: "Secure Medical History",
    description: "Your medical records are encrypted and stored securely. Access your complete health history anytime, and share it safely with authorized providers."
  }
];

const Features = () => {
  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Healthcare Made Simple
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our platform combines cutting-edge AI with intuitive design to make managing your health effortless.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group border-2 border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg bg-background"
            >
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors duration-300">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
