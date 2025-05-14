import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmationModal, FormModal, InformationModal } from "@/components/ui/modal-system";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ModalSystemDemo() {
  // Confirmation Modal state
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmationVariant, setConfirmationVariant] = useState<"info" | "success" | "warning" | "danger">("info");
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Form Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");

  // Information Modal state
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoVariant, setInfoVariant] = useState<"info" | "success" | "warning" | "danger">("info");

  // Confirmation Modal handlers
  const handleConfirm = async () => {
    setConfirmLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setConfirmLoading(false);
    console.log("Confirmed!");
  };

  // Form Modal handlers
  const handleFormSubmit = async () => {
    setFormLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Form submitted:", { name: formName, description: formDescription });
    setFormLoading(false);
    // Reset form
    setFormName("");
    setFormDescription("");
  };

  return (
    <div className="flex flex-col gap-8 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Modal System Demo</h2>
        <p className="text-muted-foreground mb-6">
          A demonstration of the different modal types available in the system.
        </p>
      </div>

      {/* Confirmation Modal Section */}
      <div className="border rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Confirmation Modals</h3>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => {
              setConfirmationVariant("info");
              setConfirmationOpen(true);
            }}
          >
            Info Confirmation
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setConfirmationVariant("warning");
              setConfirmationOpen(true);
            }}
          >
            Warning Confirmation
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setConfirmationVariant("success");
              setConfirmationOpen(true);
            }}
          >
            Success Confirmation
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setConfirmationVariant("danger");
              setConfirmationOpen(true);
            }}
          >
            Danger Confirmation
          </Button>
        </div>

        <ConfirmationModal
          title={`${confirmationVariant.charAt(0).toUpperCase() + confirmationVariant.slice(1)} Confirmation`}
          description="Please confirm to proceed with this action."
          open={confirmationOpen}
          onOpenChange={setConfirmationOpen}
          variant={confirmationVariant}
          onConfirm={handleConfirm}
          isLoading={confirmLoading}
        >
          <p>
            {confirmationVariant === "danger"
              ? "This action cannot be undone. Are you sure you want to proceed?"
              : confirmationVariant === "warning"
              ? "This action may have consequences. Do you want to continue?"
              : confirmationVariant === "success"
              ? "Your changes are about to be saved. Confirm to proceed."
              : "Please confirm to continue with this action."}
          </p>
        </ConfirmationModal>
      </div>

      {/* Form Modal Section */}
      <div className="border rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Form Modal</h3>
        <Button onClick={() => setFormOpen(true)}>Open Form Modal</Button>

        <FormModal
          title="Create New Item"
          description="Fill out the form to create a new item."
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={handleFormSubmit}
          isLoading={formLoading}
        >
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Enter description"
              />
            </div>
          </div>
        </FormModal>
      </div>

      {/* Information Modal Section */}
      <div className="border rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Information Modals</h3>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setInfoVariant("info");
              setInfoOpen(true);
            }}
          >
            Info Modal
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setInfoVariant("success");
              setInfoOpen(true);
            }}
          >
            Success Modal
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setInfoVariant("warning");
              setInfoOpen(true);
            }}
          >
            Warning Modal
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setInfoVariant("danger");
              setInfoOpen(true);
            }}
          >
            Danger Modal
          </Button>
        </div>

        <InformationModal
          title={`${infoVariant.charAt(0).toUpperCase() + infoVariant.slice(1)} Information`}
          description="Important information about your account or actions."
          open={infoOpen}
          onOpenChange={setInfoOpen}
          variant={infoVariant}
        >
          <div className="space-y-2">
            <p>
              {infoVariant === "info"
                ? "This is an informational message to keep you updated."
                : infoVariant === "success"
                ? "Your action was completed successfully!"
                : infoVariant === "warning"
                ? "This is a warning message. Please proceed with caution."
                : "This is an error message. Something went wrong."}
            </p>
            {infoVariant === "danger" && (
              <p className="text-sm text-muted-foreground">
                Please try again later or contact support if the problem persists.
              </p>
            )}
          </div>
        </InformationModal>
      </div>
    </div>
  );
} 