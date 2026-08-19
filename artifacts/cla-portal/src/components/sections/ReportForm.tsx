import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateCase } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldAlert } from "lucide-react";

const formSchema = z.object({
  reporterName: z.string().min(1, "Required"),
  reporterPhone: z.string().min(1, "Required"),
  childName: z.string().min(1, "Required"),
  childAge: z.coerce.number().min(0).max(17),
  country: z.string().min(1, "Required"),
  province: z.string().min(1, "Required"),
  lastSeen: z.string().min(1, "Required"),
  dateMissing: z.string().min(1, "Required"),
  description: z.string().min(1, "Required"),
  gpsEnrolled: z.string().min(1, "Required"),
  caseType: z.string().min(1, "Required"),
});

export function ReportForm() {
  const [successId, setSuccessId] = useState<string | null>(null);
  const createCase = useCreateCase();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reporterName: "",
      reporterPhone: "",
      childName: "",
      childAge: 0,
      country: "Canada",
      province: "",
      lastSeen: "",
      dateMissing: new Date().toISOString().split("T")[0],
      description: "",
      gpsEnrolled: "unknown",
      caseType: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createCase.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          setSuccessId(data.caseId || `CLA-${Math.floor(Math.random()*10000)}`);
          form.reset();
        },
      }
    );
  };

  return (
    <section id="report" className="py-16 px-4 border-b border-border bg-card">
      <div className="container mx-auto max-w-4xl">
        <Card className="border-primary/50 bg-background/50 rounded-sm">
          <CardHeader className="border-b border-border bg-primary/5">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-primary" />
              <div>
                <CardTitle className="uppercase text-2xl tracking-widest text-primary">Report Missing Child</CardTitle>
                <CardDescription className="font-mono text-muted-foreground uppercase tracking-widest mt-1">
                  Submit critical intelligence to the CLA Command Center
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            {successId ? (
              <div className="text-center py-12 space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-500 mb-4">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold uppercase text-foreground">Report Submitted</h3>
                <p className="font-mono text-muted-foreground">Command Center has received your intelligence.</p>
                <div className="p-4 bg-muted border border-border inline-block rounded-sm mt-4">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Case Reference ID</p>
                  <p className="text-xl font-bold font-mono tracking-widest text-primary">{successId}</p>
                </div>
                <div className="pt-8">
                  <Button onClick={() => setSuccessId(null)} variant="outline" className="font-mono uppercase">
                    Submit Another Report
                  </Button>
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2">Reporter Information</h4>
                      <FormField control={form.control} name="reporterName" render={({ field }) => (
                        <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input className="bg-muted" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="reporterPhone" render={({ field }) => (
                        <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input className="bg-muted" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    
                    <div className="space-y-6">
                      <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2">Target Information</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="childName" render={({ field }) => (
                          <FormItem><FormLabel>Child's Name</FormLabel><FormControl><Input className="bg-muted" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="childAge" render={({ field }) => (
                          <FormItem><FormLabel>Age (0-17)</FormLabel><FormControl><Input type="number" className="bg-muted" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="country" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger className="bg-muted"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                              <SelectContent><SelectItem value="Canada">Canada</SelectItem><SelectItem value="USA">USA</SelectItem></SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="province" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Province/State</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger className="bg-muted"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="Ontario">Ontario</SelectItem>
                                <SelectItem value="Quebec">Quebec</SelectItem>
                                <SelectItem value="BC">British Columbia</SelectItem>
                                <SelectItem value="Alberta">Alberta</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="lastSeen" render={({ field }) => (
                          <FormItem><FormLabel>Last Seen Location</FormLabel><FormControl><Input className="bg-muted" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="dateMissing" render={({ field }) => (
                          <FormItem><FormLabel>Date Missing</FormLabel><FormControl><Input type="date" className="bg-muted" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="caseType" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Classification</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger className="bg-muted"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="Lost Child">Lost Child</SelectItem>
                                <SelectItem value="Runaway Teen">Runaway Teen</SelectItem>
                                <SelectItem value="Kidnapping">Kidnapping</SelectItem>
                                <SelectItem value="Stolen Newborn">Stolen Newborn</SelectItem>
                                <SelectItem value="School Non-Attendance">School Non-Attendance</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="gpsEnrolled" render={({ field }) => (
                          <FormItem>
                            <FormLabel>GPS Enrolled?</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger className="bg-muted"><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="yes">Yes</SelectItem>
                                <SelectItem value="no">No</SelectItem>
                                <SelectItem value="unknown">Unknown</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <FormField control={form.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Description / Distinctive Features</FormLabel><FormControl><Textarea className="bg-muted h-24 resize-none" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-border flex justify-end">
                    <Button type="submit" size="lg" className="w-full md:w-auto uppercase font-bold tracking-widest" disabled={createCase.isPending}>
                      {createCase.isPending ? "Transmitting..." : "Submit Intelligence"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
