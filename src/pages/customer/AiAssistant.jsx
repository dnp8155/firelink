import React from "react";
import { PageHeader } from "@/components/ui-bits";
import AiAssistantChat from "@/components/AiAssistantChat";
import { Sparkles } from "lucide-react";

export default function AiAssistant() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="AI Assistant" icon={Sparkles} subtitle="Product guidance, compliance basics and platform help — powered by AI." />
      <AiAssistantChat mode="customer" />
    </div>
  );
}