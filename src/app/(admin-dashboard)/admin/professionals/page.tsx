"use client";

import { AdminHeader, ListingBadge } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { professionals } from "@/Mockdata";
import { setListingVisibility } from "@/redux/slices/adminSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

export default function AdminProfessionalsPage() {
  const dispatch = useAppDispatch();
  const listingStatus = useAppSelector((state) => state.admin.listingStatus);
  const memberships = useAppSelector((state) => state.admin.memberships);

  return (
    <div className="space-y-5">
      <AdminHeader
        title="Professionals"
        hint="Directory quality only. Suspend a listing to hide it from Find a Pro. This does not process repair payments."
      />

      <div className="overflow-hidden rounded-[16px] border border-line bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-line bg-surface text-xs text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Business</th>
              <th className="px-4 py-3 font-medium">Trade / area</th>
              <th className="px-4 py-3 font-medium">Clearance</th>
              <th className="px-4 py-3 font-medium">Membership</th>
              <th className="px-4 py-3 font-medium">Listing</th>
            </tr>
          </thead>
          <tbody>
            {professionals
              .filter((pro) => pro.clearance === "cleared" || listingStatus[pro.id])
              .slice(0, 16)
              .map((pro) => {
                const visibility = listingStatus[pro.id] ?? "live";
                const membership = memberships.find((item) => item.proId === pro.id);
                return (
                  <tr key={pro.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-title">{pro.businessName}</p>
                      <p className="text-xs text-muted">{pro.name}</p>
                    </td>
                    <td className="px-4 py-3 text-copy">
                      {pro.trade} · {pro.city} · {pro.radiusMiles} mi
                    </td>
                    <td className="px-4 py-3 text-copy">{pro.clearance}</td>
                    <td className="px-4 py-3 text-copy">{membership?.state ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <ListingBadge visibility={visibility} />
                        {visibility === "suspended" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              dispatch(setListingVisibility({ proId: pro.id, visibility: "live", businessName: pro.businessName }))
                            }
                          >
                            Restore
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              dispatch(
                                setListingVisibility({
                                  proId: pro.id,
                                  visibility: "suspended",
                                  businessName: pro.businessName,
                                }),
                              )
                            }
                          >
                            Suspend
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
