"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/dashboard-ui";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [schoolName, setSchoolName] = useState("Holy Heart Christian Academy");
  const [schoolYear, setSchoolYear] = useState("2026–2027");
  const [cutoff, setCutoff] = useState("07:45");

  const save = (e) => {
    e.preventDefault();
    toast.success("Settings saved.");
  };

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Configure school-wide attendance options."
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <h2 className="font-heading text-base font-semibold text-foreground">
            General
          </h2>
          <p className="text-sm text-muted-foreground">
            These settings apply across the whole system.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="school">School name</Label>
              <Input
                id="school"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="year">School year</Label>
                <Input
                  id="year"
                  value={schoolYear}
                  onChange={(e) => setSchoolYear(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cutoff">Late cut-off time</Label>
                <Input
                  id="cutoff"
                  type="time"
                  value={cutoff}
                  onChange={(e) => setCutoff(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit">Save changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
