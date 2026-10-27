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
import { cn } from "@/lib/cn";

export default function ProServicesPage() {
  const dispatch = useAppDispatch();
  const proProfile = useAppSelector((state) => state.features.proProfile);
  const services = proProfile.services ?? [];

  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state for modal
  const [serviceForm, setServiceForm] = useState({
    name: "",
    price: 95,
    unit: "starting rate",
    description: "",
  });

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  const minStartingRate = useMemo(() => {
    if (!services.length) return 0;
    return Math.min(...services.map((s) => s.price));
  }, [services]);

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return services;
    const q = searchQuery.toLowerCase().trim();
    return services.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        s.unit.toLowerCase().includes(q),
    );
  }, [services, searchQuery]);

  function handleOpenAdd() {
    setEditingServiceId(null);
    setServiceForm({
      name: "",
      price: 95,
      unit: "starting rate",
      description: "",
    });
    setShowModal(true);
  }

  function handleOpenEdit(srv: ProServiceItem) {
    setEditingServiceId(srv.id);
    setServiceForm({
      name: srv.name,
      price: srv.price,
      unit: srv.unit || "starting rate",
      description: srv.description || "",
    });
    setShowModal(true);
  }

  function handleSaveService() {
    if (!serviceForm.name.trim()) return;

    let updatedList: ProServiceItem[];
    if (editingServiceId) {
      updatedList = services.map((s) =>
        s.id === editingServiceId
          ? {
              ...s,
              name: serviceForm.name.trim(),
              price: Number(serviceForm.price) || 0,
              unit: serviceForm.unit.trim() || "starting rate",
              description: serviceForm.description.trim(),
            }
          : s,
      );
      showToast("Service details updated!");
    } else {
      const newService: ProServiceItem = {
        id: `srv-${Date.now()}`,
        name: serviceForm.name.trim(),
        price: Number(serviceForm.price) || 0,
        unit: serviceForm.unit.trim() || "starting rate",
        description: serviceForm.description.trim(),
      };
      updatedList = [...services, newService];
      showToast("New service added to public storefront!");
    }

    const newMin = Math.min(...updatedList.map((s) => s.price));
    dispatch(
      updateProProfile({
        services: updatedList,
        startingPrice: newMin > 0 ? newMin : proProfile.startingPrice,
      }),
    );
    setShowModal(false);
  }

  function handleDeleteService(id: string) {
    const updatedList = services.filter((s) => s.id !== id);
    const newMin = updatedList.length ? Math.min(...updatedList.map((s) => s.price)) : 0;
    dispatch(
      updateProProfile({
        services: updatedList,
        startingPrice: newMin > 0 ? newMin : proProfile.startingPrice,
      }),
    );
    showToast("Service removed from storefront.");
  }

  const commonPresets = [
    { name: "Emergency Pipe Leak Repair", price: 95, unit: "starting rate", desc: "Non-invasive electronic leak detection and immediate pipe reseal." },
    { name: "Water Heater Diagnostic & Flush", price: 140, unit: "flush & diag", desc: "Tank & tankless servicing, element replacement, and anode rod inspection." },
    { name: "Main Line Drain Clearing & Hydro-Jetting", price: 89, unit: "starting rate", desc: "Kitchen sinks, bathroom lines, and main sewer branch snake clearing." },
    { name: "Fixture, Toilet & Faucet Installation", price: 110, unit: "per fixture", desc: "OEM fixture mounting, supply hookups, and leak-tested seal guarantee." },
    { name: "Garbage Disposal Repair & Swap", price: 85, unit: "starting rate", desc: "Humming or jammed disposals, seal gaskets, and brand new unit installs." },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
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
          <h1 className="font-display text-[22px] sm:text-[26px] font-bold text-title tracking-tight flex items-center gap-2.5">
            <Wrench className="h-6 w-6 text-primary" />
            Services &amp; Pricing
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted">
            Manage your service offerings, starting prices, and job scopes displayed on your public profile.
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
            placeholder="Search your services by name, rate or keyword…"
            className="w-full rounded-xl border border-line/80 bg-white py-2 pl-3 pr-3 text-xs sm:text-sm text-title outline-none focus:border-primary shadow-2xs"
          />
        </div>
      </div>

      {/* 4. Services Grid (Consistent with Homeowner Public Profile Look) */}
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
        <div className="space-y-3.5">
          {filteredServices.map((srv) => (
            <Card
              key={srv.id}
              className="overflow-hidden rounded-2xl border border-line/80 bg-white p-4 sm:p-5 shadow-xs hover:border-line hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs mt-0.5">
                    <Check className="h-5 w-5 stroke-[2.5]" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-sm sm:text-base font-bold text-title">
                        {srv.name}
                      </h2>
                      <span className="rounded-full bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 text-xs font-bold text-primary">
                        ${srv.price}
                      </span>
                      <span className="text-xs text-muted font-medium">/ {srv.unit}</span>
                    </div>

                    <p className="mt-1 text-xs sm:text-[13px] text-stone-600 leading-relaxed">
                      {srv.description || "Includes full diagnosis, verified labor, and parts warranty."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(srv)}
                    className="p-2 rounded-xl text-muted hover:text-title hover:bg-stone-100 transition cursor-pointer"
                    title="Edit service details"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteService(srv.id)}
                    className="p-2 rounded-xl text-muted hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                    title="Delete service"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 5. Add / Edit Service Modal */}
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

              <div className="grid grid-cols-2 gap-3">
                <Field label="Starting Price ($)">
                  <TextField
                    type="number"
                    value={serviceForm.price}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setServiceForm({ ...serviceForm, price: Number(e.target.value) || 0 })
                    }
                    placeholder="95"
                  />
                </Field>
                <Field label="Rate Type">
                  <TextField
                    value={serviceForm.unit}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setServiceForm({ ...serviceForm, unit: e.target.value })
                    }
                    placeholder="starting rate, per fixture, /hr"
                  />
                </Field>
              </div>

              <Field label="Service Scope &amp; Description">
                <TextField
                  value={serviceForm.description}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setServiceForm({ ...serviceForm, description: e.target.value })
                  }
                  placeholder="Briefly state what is included in this repair or installation."
                />
              </Field>

              {/* Quick Preset Selector */}
              {!editingServiceId && (
                <div>
                  <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1.5">
                    Or select a common trade preset:
                  </p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {commonPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setServiceForm({
                            name: preset.name,
                            price: preset.price,
                            unit: preset.unit,
                            description: preset.desc,
                          })
                        }
                        className="w-full text-left rounded-xl border border-line/80 p-2 hover:border-primary hover:bg-stone-50 transition text-xs flex items-center justify-between"
                      >
                        <span className="font-semibold text-title truncate">{preset.name}</span>
                        <span className="text-primary font-bold shrink-0 ml-2">${preset.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
