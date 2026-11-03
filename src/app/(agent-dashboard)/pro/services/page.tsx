"use client";

import { useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Edit2,
  Filter,
  Plus,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, TextField } from "@/components/ui/field";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { updateProProfile, type ProServiceItem } from "@/redux/slices/featuresSlice";

export default function ProServicesPage() {
  const dispatch = useAppDispatch();
  const proProfile = useAppSelector((state) => state.features.proProfile);
  const services = useMemo(() => proProfile.services ?? [], [proProfile.services]);

  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state for modal (pricing completely removed)
  const [serviceForm, setServiceForm] = useState({
    name: "",
    category: "",
    description: "",
  });

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return services;
    const q = searchQuery.toLowerCase().trim();
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.category && s.category.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q)),
    );
  }, [services, searchQuery]);

  function handleOpenAdd() {
    setEditingServiceId(null);
    setServiceForm({
      name: "",
      category: "",
      description: "",
    });
    setShowModal(true);
  }

  function handleOpenEdit(srv: ProServiceItem) {
    setEditingServiceId(srv.id);
    setServiceForm({
      name: srv.name,
      category: srv.category || "",
      description: srv.description || "",
    });
    setShowModal(true);
  }

  function handleSaveService() {
    if (!serviceForm.name.trim()) return;

    const trimmedCat = serviceForm.category.trim();
    let updatedList: ProServiceItem[];
    if (editingServiceId) {
      updatedList = services.map((s) =>
        s.id === editingServiceId
          ? {
              ...s,
              name: serviceForm.name.trim(),
              category: trimmedCat || undefined,
              description: serviceForm.description.trim(),
            }
          : s,
      );
      showToast("Service details updated!");
    } else {
      const newService: ProServiceItem = {
        id: `srv-${Date.now()}`,
        name: serviceForm.name.trim(),
        category: trimmedCat || undefined,
        description: serviceForm.description.trim(),
      };
      updatedList = [...services, newService];
      showToast("New service added to public storefront!");
    }

    dispatch(
      updateProProfile({
        services: updatedList,
      }),
    );
    setShowModal(false);
  }

  function handleDeleteService(id: string) {
    const updatedList = services.filter((s) => s.id !== id);
    dispatch(
      updateProProfile({
        services: updatedList,
      }),
    );
    showToast("Service removed from storefront.");
  }

  return (
    <div className="w-full max-w-5xl space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-title px-5 py-3 text-white shadow-xl animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* 1. Page Header with Title & Add Service Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line/70 pb-4 pt-1">
        <div>
          <h1 className="font-display text-[22px] sm:text-[26px] font-bold text-title tracking-tight">
            Services Offered
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted">
            Manage your service offerings and job scopes displayed on your public storefront.
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={handleOpenAdd}
          className="rounded-full text-xs font-semibold gap-1.5 shadow-xs self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Add Service
        </Button>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your services by name or description…"
            className="w-full rounded-xl border border-line/80 bg-white py-2 pl-3 pr-3 text-xs sm:text-sm text-title outline-none focus:border-primary shadow-2xs"
          />
        </div>
      </div>

      {/* 3. Services Grid: Balanced 2-Column Responsive Cards */}
      {filteredServices.length === 0 ? (
        <Card className="rounded-2xl border border-line/80 bg-white p-10 text-center">
          <Filter className="mx-auto mb-3 h-8 w-8 text-muted/60" />
          <p className="font-display text-base font-bold text-title">No matching services found</p>
          <p className="mt-1 text-xs text-muted max-w-sm mx-auto">
            Try adjusting your search or add a new service item to your listing.
          </p>
          <Button
            type="button"
            size="sm"
            onClick={handleOpenAdd}
            className="mt-4 rounded-full text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add First Service
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredServices.map((srv) => (
            <Card
              key={srv.id}
              className="flex flex-col justify-between rounded-2xl border border-line/80 bg-white p-5 shadow-xs hover:border-line hover:shadow-sm transition-all duration-200"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-smoke/80 text-primary border border-line/70 shadow-2xs mt-0.5">
                      <Wrench className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-display text-sm sm:text-[15px] font-bold text-title leading-snug">
                          {srv.name}
                        </h2>
                        {srv.category && (
                          <span className="inline-flex items-center rounded-md bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-semibold border border-primary/20">
                            {srv.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 -mr-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(srv)}
                      className="p-1.5 rounded-lg text-muted hover:text-title hover:bg-stone-100 transition cursor-pointer"
                      title="Edit service"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteService(srv.id)}
                      className="p-1.5 rounded-lg text-muted hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="Delete service"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-xs sm:text-[13px] text-stone-600 leading-relaxed">
                  {srv.description || "Full diagnostic, professional trade labor, and guaranteed craftsmanship."}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 4. Add / Edit Service Modal (No Pricing Fields) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-[22px] border border-line bg-white p-6 shadow-xl animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-line/70 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-title">
                    {editingServiceId ? "Edit Service Item" : "Add Service Item"}
                  </h3>
                  <p className="text-xs text-muted">Set what homeowners see and request on your storefront.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-muted hover:text-title cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <Field label="Service Name">
                <TextField
                  value={serviceForm.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setServiceForm({ ...serviceForm, name: e.target.value })
                  }
                  placeholder="e.g. Tankless Water Heater Flush"
                />
              </Field>

              <Field label="Category / Specialty (Optional)">
                <TextField
                  value={serviceForm.category}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setServiceForm({ ...serviceForm, category: e.target.value })
                  }
                  placeholder="e.g. Troubleshooting, Lighting, Repairs, Installation…"
                />
              </Field>

              <Field label="Service Scope & Description">
                <TextField
                  value={serviceForm.description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setServiceForm({ ...serviceForm, description: e.target.value })
                  }
                  placeholder="Briefly state what is included in this repair or installation."
                />
              </Field>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-line/60">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowModal(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!serviceForm.name.trim()}
                onClick={handleSaveService}
                className="text-xs font-semibold gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                {editingServiceId ? "Save Changes" : "Add Service"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
