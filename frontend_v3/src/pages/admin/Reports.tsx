import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileBarChart } from "lucide-react";

export default function Reports() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Analytics & Reports</h1>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileBarChart className="h-5 w-5" />
                        System Overview
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Historical triage data and clinician efficiency metrics will be displayed here.</p>
                </CardContent>
            </Card>
        </div>
    );
}
