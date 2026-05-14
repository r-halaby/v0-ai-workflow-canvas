"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import type { WorkspaceSettings, MemberRole, ProductConfig } from "@/lib/atlas-types";
import { PRODUCT_COLORS } from "@/lib/atlas-types";

type SettingsTab = "general" | "members" | "products" | "preferences";

interface WorkspaceSettingsProps {
  open: boolean;
  onClose: () => void;
  settings: WorkspaceSettings;
  onSettingsChange: (settings: WorkspaceSettings) => void;
}

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: "Owner",
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

export function WorkspaceSettingsDialog({
  open,
  onClose,
  settings,
  onSettingsChange,
}: WorkspaceSettingsProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [inviteEmail, setInviteEmail] = useState("");

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "general",
      label: "General",
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14.55 11.25C14.4333 11.5166 14.3979 11.8123 14.4482 12.0992C14.4985 12.3861 14.6323 12.6517 14.8333 12.8625L14.8875 12.9167C15.0489 13.078 15.1768 13.2696 15.2641 13.4804C15.3514 13.6912 15.3964 13.917 15.3964 14.1451C15.3964 14.3731 15.3514 14.5989 15.2641 14.8097C15.1768 15.0205 15.0489 15.2122 14.8875 15.3735C14.7262 15.5349 14.5345 15.6628 14.3237 15.7501C14.1129 15.8374 13.8871 15.8824 13.6591 15.8824C13.431 15.8824 13.2052 15.8374 12.9944 15.7501C12.7836 15.6628 12.5919 15.5349 12.4306 15.3735L12.3764 15.3193C12.1656 15.1183 11.9 14.9846 11.6131 14.9343C11.3262 14.884 11.0305 14.9194 10.764 15.036C10.5028 15.1469 10.2813 15.3324 10.1267 15.5696C9.97213 15.8068 9.89122 16.0849 9.89396 16.3685V16.5C9.89396 16.9602 9.71117 17.4016 9.38611 17.7267C9.06104 18.0517 8.61962 18.2345 8.15943 18.2345C7.69923 18.2345 7.25781 18.0517 6.93275 17.7267C6.60768 17.4016 6.4249 16.9602 6.4249 16.5V16.431C6.41718 16.1399 6.32742 15.8569 6.16609 15.6174C6.00476 15.3779 5.77869 15.1919 5.51358 15.0819C5.24708 14.9653 4.95139 14.9299 4.66449 14.9802C4.3776 15.0305 4.11196 15.1642 3.90115 15.3652L3.84694 15.4194C3.68563 15.5808 3.49396 15.7087 3.28317 15.796C3.07238 15.8833 2.84656 15.9283 2.61854 15.9283C2.39052 15.9283 2.1647 15.8833 1.95391 15.796C1.74312 15.7087 1.55145 15.5808 1.39014 15.4194C1.22873 15.2581 1.10087 15.0665 1.01356 14.8557C0.926249 14.6449 0.881272 14.4191 0.881272 14.191C0.881272 13.963 0.926249 13.7372 1.01356 13.5264C1.10087 13.3156 1.22873 13.1239 1.39014 12.9626L1.44435 12.9084C1.64533 12.6976 1.77908 12.432 1.82936 12.1451C1.87965 11.8582 1.84422 11.5625 1.72762 11.296C1.61668 11.0348 1.43116 10.8133 1.19399 10.6587C0.956815 10.5041 0.678688 10.4232 0.395077 10.426H0.263687C-0.196508 10.426 -0.637924 10.2432 -0.962992 9.91813C-1.28806 9.59307 -1.47084 9.15165 -1.47084 8.69145C-1.47084 8.23126 -1.28806 7.78984 -0.962992 7.46478C-0.637924 7.13971 -0.196508 6.95693 0.263687 6.95693H0.332774C0.623912 6.94921 0.906917 6.85945 1.14641 6.69812C1.38591 6.53679 1.57186 6.31072 1.68185 6.04561C1.79844 5.77911 1.83388 5.48342 1.78359 5.19652C1.73331 4.90963 1.59955 4.64399 1.39858 4.43318L1.34437 4.37897C1.18296 4.21766 1.0551 4.02599 0.967792 3.8152C0.880482 3.60441 0.835505 3.37859 0.835505 3.15057C0.835505 2.92255 0.880482 2.69673 0.967792 2.48594C1.0551 2.27515 1.18296 2.08348 1.34437 1.92217C1.50568 1.76076 1.69735 1.6329 1.90814 1.54559C2.11893 1.45828 2.34475 1.4133 2.57277 1.4133C2.80079 1.4133 3.02661 1.45828 3.2374 1.54559C3.44819 1.6329 3.63986 1.76076 3.80117 1.92217L3.85538 1.97638C4.06619 2.17735 4.33183 2.31111 4.61872 2.36139C4.90562 2.41168 5.20131 2.37624 5.46781 2.25965H5.51358C5.77479 2.14871 5.99629 1.96319 6.15087 1.72602C6.30546 1.48884 6.38637 1.21072 6.38363 0.927106V0.795716C6.38363 0.335522 6.56641 -0.105894 6.89148 -0.430962C7.21654 -0.75603 7.65796 -0.938812 8.11816 -0.938812C8.57835 -0.938812 9.01977 -0.75603 9.34484 -0.430962C9.6699 -0.105894 9.85269 0.335522 9.85269 0.795716V0.864803C9.84995 1.14842 9.93086 1.42654 10.0854 1.66372C10.24 1.90089 10.4615 2.08641 10.7228 2.19735C10.9893 2.31395 11.285 2.34938 11.5719 2.2991C11.8588 2.24881 12.1244 2.11506 12.3352 1.91408L12.3894 1.85987C12.5507 1.69846 12.7424 1.5706 12.9532 1.48329C13.164 1.39598 13.3898 1.351 13.6178 1.351C13.8459 1.351 14.0717 1.39598 14.2825 1.48329C14.4933 1.5706 14.6849 1.69846 14.8462 1.85987C15.0077 2.02118 15.1355 2.21285 15.2228 2.42364C15.3101 2.63443 15.3551 2.86025 15.3551 3.08827C15.3551 3.31629 15.3101 3.54211 15.2228 3.7529C15.1355 3.96369 15.0077 4.15536 14.8462 4.31667L14.792 4.37088C14.5911 4.58169 14.4573 4.84733 14.407 5.13422C14.3567 5.42112 14.3922 5.71681 14.5088 5.98331V6.02908C14.6197 6.29029 14.8052 6.51179 15.0424 6.66637C15.2796 6.82096 15.5577 6.90187 15.8413 6.89913H15.9727C16.4329 6.89913 16.8743 7.08191 17.1994 7.40698C17.5244 7.73204 17.7072 8.17346 17.7072 8.63366C17.7072 9.09385 17.5244 9.53527 17.1994 9.86034C16.8743 10.1854 16.4329 10.3682 15.9727 10.3682H15.9036C15.62 10.3709 15.3419 10.4518 15.1047 10.6064C14.8675 10.761 14.682 10.9825 14.5711 11.2437L14.55 11.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      id: "members",
      label: "Members",
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.75 15.75V14.25C12.75 13.4544 12.4339 12.6913 11.8713 12.1287C11.3087 11.5661 10.5456 11.25 9.75 11.25H3.75C2.95435 11.25 2.19129 11.5661 1.62868 12.1287C1.06607 12.6913 0.75 13.4544 0.75 14.25V15.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6.75 8.25C8.40685 8.25 9.75 6.90685 9.75 5.25C9.75 3.59315 8.40685 2.25 6.75 2.25C5.09315 2.25 3.75 3.59315 3.75 5.25C3.75 6.90685 5.09315 8.25 6.75 8.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M17.25 15.75V14.25C17.2495 13.5853 17.0283 12.9396 16.6201 12.4143C16.2119 11.889 15.6393 11.5137 14.9925 11.3475" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12.2425 2.3475C12.891 2.51273 13.4652 2.88803 13.8746 3.41416C14.284 3.94029 14.5056 4.58744 14.5056 5.25375C14.5056 5.92006 14.284 6.56721 13.8746 7.09334C13.4652 7.61947 12.891 7.99477 12.2425 8.16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      id: "products",
      label: "Products",
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15.75 11.25V6.75C15.7497 6.48706 15.6803 6.22882 15.5487 6.00177C15.4172 5.77472 15.2282 5.58697 15 5.4575L9.75 2.4575C9.52146 2.32775 9.26291 2.25879 9 2.25879C8.73709 2.25879 8.47854 2.32775 8.25 2.4575L3 5.4575C2.77181 5.58697 2.58285 5.77472 2.45127 6.00177C2.31969 6.22882 2.25033 6.48706 2.25 6.75V11.25C2.25033 11.5129 2.31969 11.7712 2.45127 11.9982C2.58285 12.2253 2.77181 12.413 3 12.5425L8.25 15.5425C8.47854 15.6722 8.73709 15.7412 9 15.7412C9.26291 15.7412 9.52146 15.6722 9.75 15.5425L15 12.5425C15.2282 12.413 15.4172 12.2253 15.5487 11.9982C15.6803 11.7712 15.7497 11.5129 15.75 11.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2.4525 5.97L9 9.7575L15.5475 5.97" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 16.02V9.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      id: "preferences",
      label: "Preferences",
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 4.5H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 9H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 13.5H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="6" cy="4.5" r="1.5" fill="currentColor"/>
          <circle cx="12" cy="9" r="1.5" fill="currentColor"/>
          <circle cx="7.5" cy="13.5" r="1.5" fill="currentColor"/>
        </svg>
      ),
    },
  ];

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    
    const newMember = {
      id: `m-${Date.now()}`,
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      initials: inviteEmail.slice(0, 2).toUpperCase(),
      role: "viewer" as MemberRole,
    };
    
    onSettingsChange({
      ...settings,
      members: [...settings.members, newMember],
    });
    setInviteEmail("");
  };

  const handleRoleChange = (memberId: string, role: MemberRole) => {
    onSettingsChange({
      ...settings,
      members: settings.members.map((m) =>
        m.id === memberId ? { ...m, role } : m
      ),
    });
  };

  const handleRemoveMember = (memberId: string) => {
    onSettingsChange({
      ...settings,
      members: settings.members.filter((m) => m.id !== memberId),
    });
  };

  const handleProductToggle = (productId: string) => {
    onSettingsChange({
      ...settings,
      products: settings.products.map((p) =>
        p.id === productId ? { ...p, enabled: !p.enabled } : p
      ),
    });
  };

  const handlePreferenceChange = <K extends keyof WorkspaceSettings["preferences"]>(
    key: K,
    value: WorkspaceSettings["preferences"][K]
  ) => {
    onSettingsChange({
      ...settings,
      preferences: { ...settings.preferences, [key]: value },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="p-0 gap-0 overflow-hidden"
        style={{
          backgroundColor: "#111111",
          border: "1px solid #222222",
          borderRadius: "16px",
          maxWidth: "720px",
          width: "90vw",
          maxHeight: "85vh",
        }}
      >
        <div className="flex h-[560px]">
          {/* Sidebar */}
          <div
            className="w-52 flex-shrink-0 p-4 flex flex-col gap-1"
            style={{ borderRight: "1px solid #222222", backgroundColor: "#0A0A0A" }}
          >
            <h2
              className="text-white font-semibold text-lg px-3 py-2 mb-2"
              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
            >
              Settings
            </h2>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  activeTab === tab.id
                    ? "text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
                style={{
                  backgroundColor: activeTab === tab.id ? "#1C1C1E" : "transparent",
                  fontFamily: "system-ui, Inter, sans-serif",
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === "general" && (
              <div className="space-y-6">
                <div>
                  <h3
                    className="text-white font-semibold text-base mb-4"
                    style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                  >
                    Workspace Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label
                        className="block text-xs text-gray-500 mb-1.5"
                        style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                      >
                        Workspace Name
                      </label>
                      <input
                        type="text"
                        value={settings.name}
                        onChange={(e) =>
                          onSettingsChange({ ...settings, name: e.target.value })
                        }
                        className="w-full px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30"
                        style={{
                          backgroundColor: "#1a1a1a",
                          border: "1px solid #333333",
                          fontFamily: "system-ui, Inter, sans-serif",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-xs text-gray-500 mb-1.5"
                        style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                      >
                        Description
                      </label>
                      <textarea
                        value={settings.description || ""}
                        onChange={(e) =>
                          onSettingsChange({ ...settings, description: e.target.value })
                        }
                        rows={3}
                        className="w-full px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30 resize-none"
                        style={{
                          backgroundColor: "#1a1a1a",
                          border: "1px solid #333333",
                          fontFamily: "system-ui, Inter, sans-serif",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-xs text-gray-500 mb-1.5"
                        style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                      >
                        Workspace ID
                      </label>
                      <div
                        className="px-3 py-2.5 rounded-lg text-sm text-gray-500"
                        style={{
                          backgroundColor: "#1a1a1a",
                          border: "1px solid #333333",
                          fontFamily: "monospace",
                        }}
                      >
                        {settings.id}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "members" && (
              <div className="space-y-6">
                <div>
                  <h3
                    className="text-white font-semibold text-base mb-4"
                    style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                  >
                    Team Members
                  </h3>
                  
                  {/* Invite */}
                  <div className="flex gap-2 mb-6">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Email address"
                      onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                      className="flex-1 px-3 py-2.5 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white/30"
                      style={{
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #333333",
                        fontFamily: "system-ui, Inter, sans-serif",
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleInvite}
                      className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: "#F0FE00",
                        color: "#121212",
                        fontFamily: "system-ui, Inter, sans-serif",
                      }}
                    >
                      Invite
                    </button>
                  </div>

                  {/* Member List */}
                  <div className="space-y-2">
                    {settings.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{ backgroundColor: "#1a1a1a" }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                            style={{ backgroundColor: "#333333" }}
                          >
                            {member.initials}
                          </div>
                          <div>
                            <div
                              className="text-sm text-white font-medium"
                              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                            >
                              {member.name}
                            </div>
                            <div
                              className="text-xs text-gray-500"
                              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                            >
                              {member.email}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={member.role || "viewer"}
                            onChange={(e) =>
                              handleRoleChange(member.id, e.target.value as MemberRole)
                            }
                            disabled={member.role === "owner"}
                            className="px-2 py-1.5 rounded-lg text-xs text-white focus:outline-none disabled:opacity-50"
                            style={{
                              backgroundColor: "#2a2a2a",
                              border: "1px solid #333333",
                              fontFamily: "system-ui, Inter, sans-serif",
                            }}
                          >
                            {Object.entries(ROLE_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                          {member.role !== "owner" && (
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member.id)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                            >
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "products" && (
              <div className="space-y-6">
                <div>
                  <h3
                    className="text-white font-semibold text-base mb-4"
                    style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                  >
                    Product Configuration
                  </h3>
                  <div className="space-y-3">
                    {settings.products.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-4 rounded-lg"
                        style={{ backgroundColor: "#1a1a1a" }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg"
                            style={{ backgroundColor: product.color }}
                          />
                          <div>
                            <div
                              className="text-sm text-white font-medium"
                              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                            >
                              {product.name}
                            </div>
                            <div
                              className="text-xs text-gray-500"
                              style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                            >
                              {product.enabled ? "Active" : "Disabled"}
                            </div>
                          </div>
                        </div>
                        <Switch
                          checked={product.enabled}
                          onCheckedChange={() => handleProductToggle(product.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "preferences" && (
              <div className="space-y-6">
                <div>
                  <h3
                    className="text-white font-semibold text-base mb-4"
                    style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                  >
                    Default Settings
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label
                        className="block text-xs text-gray-500 mb-1.5"
                        style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                      >
                        Default Product
                      </label>
                      <select
                        value={settings.preferences.defaultProduct}
                        onChange={(e) =>
                          handlePreferenceChange("defaultProduct", e.target.value as any)
                        }
                        className="w-full px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30"
                        style={{
                          backgroundColor: "#1a1a1a",
                          border: "1px solid #333333",
                          fontFamily: "system-ui, Inter, sans-serif",
                        }}
                      >
                        {settings.products.filter(p => p.enabled).map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        className="block text-xs text-gray-500 mb-1.5"
                        style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                      >
                        Default Status
                      </label>
                      <select
                        value={settings.preferences.defaultStatus}
                        onChange={(e) =>
                          handlePreferenceChange("defaultStatus", e.target.value as any)
                        }
                        className="w-full px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-white/30"
                        style={{
                          backgroundColor: "#1a1a1a",
                          border: "1px solid #333333",
                          fontFamily: "system-ui, Inter, sans-serif",
                        }}
                      >
                        <option value="draft">Draft</option>
                        <option value="in-review">In Review</option>
                        <option value="approved">Approved</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3
                    className="text-white font-semibold text-base mb-4"
                    style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                  >
                    Canvas Options
                  </h3>
                  <div className="space-y-3">
                    <div
                      className="flex items-center justify-between p-4 rounded-lg"
                      style={{ backgroundColor: "#1a1a1a" }}
                    >
                      <div>
                        <div
                          className="text-sm text-white font-medium"
                          style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                        >
                          Auto-save
                        </div>
                        <div
                          className="text-xs text-gray-500"
                          style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                        >
                          Automatically save changes
                        </div>
                      </div>
                      <Switch
                        checked={settings.preferences.autoSave}
                        onCheckedChange={(checked) =>
                          handlePreferenceChange("autoSave", checked)
                        }
                      />
                    </div>
                    <div
                      className="flex items-center justify-between p-4 rounded-lg"
                      style={{ backgroundColor: "#1a1a1a" }}
                    >
                      <div>
                        <div
                          className="text-sm text-white font-medium"
                          style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                        >
                          Show Grid
                        </div>
                        <div
                          className="text-xs text-gray-500"
                          style={{ fontFamily: "system-ui, Inter, sans-serif" }}
                        >
                          Display canvas grid lines
                        </div>
                      </div>
                      <Switch
                        checked={settings.preferences.showGrid}
                        onCheckedChange={(checked) =>
                          handlePreferenceChange("showGrid", checked)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
