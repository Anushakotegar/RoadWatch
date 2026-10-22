
import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Mail,
  MapPin,
  Phone,
  Building,
  Key,
  X,
  LogOut,
  Edit3,
} from 'lucide-react';
import { authService } from '../../services/authService';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSignIn: () => void;
  onNavigateToDashboard: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onNavigateToSignIn,
  onNavigateToDashboard,
}) => {
  const { currentUser, showToast } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [ward, setWard] = useState('');

  // Refresh editable values when the selected user changes.
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setPhone(currentUser.phone || '+91 98451 XXXXX');
      setWard(currentUser.ward || 'Ward 150 (Indiranagar)');
    }
  }, [currentUser]);

  if (!isOpen || !currentUser) {
    return null;
  }

  const handleSaveProfile = () => {
    const updated = {
      ...currentUser,
      name: name.trim(),
      phone: phone.trim(),
      ward: ward.trim(),
    };

    if (!updated.name) {
      showToast('Name cannot be empty.', 'info');
      return;
    }

    authService.setCurrentUser(updated);
    setIsEditing(false);
    showToast('Profile information updated in local session!', 'success');
  };

  const handleSignOut = () => {
    authService.signOut();
    onClose();
    showToast('Signed out of current prototype session', 'info');
    onNavigateToSignIn();
  };

  const roleLabels: Record<
    string,
    { label: string; color: string; desc: string }
  > = {
    citizen: {
      label: 'Citizen (Public Reporter)',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      desc: 'Can file issues, track resolution, provide feedback, and audit repairs.',
    },
    authority: {
      label: 'Municipal Ward Engineer',
      color: 'bg-blue-50 text-blue-800 border-blue-200',
      desc: 'Authorized to triage complaints, dispatch work crews, and review EvidenceGuard.',
    },
    field_crew: {
      label: 'Field Maintenance Squad #14',
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      desc: 'Deploys repair materials, logs asphalt compaction, and uploads photographic proof.',
    },
    admin: {
      label: 'System Administrator',
      color: 'bg-purple-50 text-purple-800 border-purple-200',
      desc: 'Administers demo accounts, ward boundaries, SLA thresholds, and audit ledgers.',
    },
  };

  const currentRoleMeta =
    roleLabels[currentUser.role] || roleLabels.citizen;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 text-slate-900 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-5">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#0D9488] text-white flex items-center justify-center font-display font-bold text-lg shadow-inner">
              {currentUser.name.charAt(0)}
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 font-display">
                {currentUser.name}
              </h2>

              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border inline-block mt-0.5 ${currentRoleMeta.color}`}
              >
                ● {currentRoleMeta.label}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile"
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Information */}
        <div className="space-y-3 text-xs">
          {/* Email */}
          <div className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 rounded border border-slate-200">
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>Email:</span>
            </div>

            <span className="font-semibold text-slate-800 font-mono break-all text-right">
              {currentUser.email}
            </span>
          </div>

          {/* Ward */}
          <div className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 rounded border border-slate-200">
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span>Jurisdiction / Ward:</span>
            </div>

            {isEditing ? (
              <input
                type="text"
                value={ward}
                onChange={(event) => setWard(event.target.value)}
                aria-label="Ward"
                className="w-44 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900"
              />
            ) : (
              <span className="font-semibold text-slate-800 text-right">
                {currentUser.ward || 'Ward 150 (Indiranagar)'}
              </span>
            )}
          </div>

          {/* Phone */}
          <div className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 rounded border border-slate-200">
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>Contact Phone:</span>
            </div>

            {isEditing ? (
              <input
                type="text"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                aria-label="Contact phone"
                className="w-44 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900"
              />
            ) : (
              <span className="font-semibold text-slate-800 font-mono">
                {currentUser.phone || '+91 98451 XXXXX'}
              </span>
            )}
          </div>

          {/* Department */}
          {currentUser.department && (
            <div className="flex items-center justify-between gap-3 p-2.5 bg-slate-50 rounded border border-slate-200">
              <div className="flex items-center gap-2 text-slate-600">
                <Building className="w-4 h-4 text-slate-400" />
                <span>Department Unit:</span>
              </div>

              <span className="font-semibold text-slate-800">
                {currentUser.department}
              </span>
            </div>
          )}

          {/* Simulated Session Token */}
          <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
            <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-500 uppercase">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-teal-600" />
                Prototype Session Token (Simulated)
              </span>
              <span className="text-emerald-700">Active</span>
            </div>

            <p className="font-mono text-[10px] text-slate-500 truncate">
              Simulated session · {currentUser.id} · {currentUser.role}
            </p>
          </div>
        </div>

        {/* Role Permissions */}
        <div className="p-3 bg-teal-50/60 border border-teal-200 rounded text-xs text-slate-700 space-y-1">
          <p className="font-semibold text-teal-900">
            Role Capabilities:
          </p>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            {currentRoleMeta.desc}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          {isEditing ? (
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setName(currentUser.name);
                  setPhone(
                    currentUser.phone || '+91 98451 XXXXX',
                  );
                  setWard(
                    currentUser.ward || 'Ward 150 (Indiranagar)',
                  );
                  setIsEditing(false);
                }}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveProfile}
                className="px-4 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-semibold rounded cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Profile
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToDashboard();
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded cursor-pointer"
                >
                  Go to My Dashboard
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToSignIn();
                  }}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded hover:bg-slate-50 cursor-pointer"
                >
                  Sign In Page
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-3 py-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 text-xs font-semibold rounded flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
