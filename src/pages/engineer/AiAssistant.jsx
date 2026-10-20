import React from "react";
import { PageHeader } from "@/components/ui-bits";
import AiAssistantChat from "@/components/AiAssistantChat";
import { Sparkles, AlertTriangle } from "lucide-react";

export default function AiAssistantEngineer() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="AI Engineering Assistant" icon={Sparkles} subtitle="Fire load, hydraulic sizing, NBC 2016 compliance and BOQ help." />
      <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-xs font-medium text-amber-800">Engineering calculations and AI recommendations require review by a qualified professional.</p>
      </div>
      <AiAssistantChat mode="engineer" />
    </div>
  );
}