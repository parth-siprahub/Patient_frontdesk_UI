import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope } from "lucide-react";

export default function ClinicianStatus() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Clinician Status</h1>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Stethoscope className="h-5 w-5" />
                        Active Doctors
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">This feature is coming soon. You will be able to see which doctors are currently in consultations.</p>
                </CardContent>
            </Card>
        </div>
    );
}
