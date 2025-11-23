"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type InngestAIPreviewDialogProps = {
  /**
   * Raw HTML returned by your Inngest AI step (e.g. the {{newsContent}} or {{intro}} HTML).
   * This will be rendered inside an isolated iframe so email styles don't leak into the app.
   */
  html: string;
  /** Optional label for the trigger button. */
  triggerLabel?: string;
  /** Optional dialog title. */
  title?: string;
  /**
   * Optional controlled open state. When provided, the dialog becomes controlled by the parent.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * When true, the internal trigger button is hidden so the parent can provide its own trigger.
   */
  hideTrigger?: boolean;
};

const InngestAIPreviewDialog: React.FC<InngestAIPreviewDialogProps> = ({
  html,
  triggerLabel = "Preview AI Email",
  title = "AI Email Preview",
  open,
  onOpenChange,
  hideTrigger = false,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button className="yellow-btn px-4 py-2 whitespace-nowrap text-sm font-medium">
            {triggerLabel}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-6xl bg-[#050505] border-gray-700 p-0 overflow-hidden sm:max-h-[90vh]">
        <DialogHeader className="px-6 pt-4 pb-2 border-b border-gray-800 bg-[#050505]">
          <DialogTitle className="text-base font-semibold text-gray-100">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="w-full bg-[#050505]">
          {/*
            Use an iframe with srcDoc so the email HTML (including its own <html>, <head>, <style>)
            renders exactly like the templates from your design without affecting the app styles.
          */}
          <iframe
            title="AI Email Preview"
            className="w-full h-[70vh] border-0 bg-[#050505]"
            srcDoc={html}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InngestAIPreviewDialog;
