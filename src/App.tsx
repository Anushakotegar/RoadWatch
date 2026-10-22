
import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ToastContainer } from './components/common/ToastContainer';

import { PublicPortal } from './pages/PublicPortal';
import { ReportIssue } from './pages/ReportIssue';
import { TrackComplaint } from './pages/TrackComplaint';
import { PublicExplorer } from './pages/PublicExplorer';
import { AuthorityWorkspace } from './pages/AuthorityWorkspace';
import { MaintenanceTasks } from './pages/MaintenanceTasks';
import { EvidenceReview } from './pages/EvidenceReview';
import { CitizenFeedback } from './pages/CitizenFeedback';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { AdminWorkspace } from './pages/AdminWorkspace';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';

function AppContent() {
  const {
    currentUser,
    activeNavTab,
    setActiveNavTab,
    setSelectedComplaintId,
  } = useApp();

  const [feedbackComplaintId, setFeedbackComplaintId] =
    useState<string>('RW-2025-8492');

  const [evidenceComplaintId, setEvidenceComplaintId] =
    useState<string>('RW-2025-8488');

  // Redirect authenticated users to the workspace for their assigned role.
  useEffect(() => {
    if (!currentUser) return;

    const workspaceByRole = {
      citizen: 'citizen-dashboard',
      authority: 'authority',
      field_crew: 'field-team',
      admin: 'admin',
    } as const;

    const isAuthenticationScreen =
      activeNavTab === 'sign-in' ||
      activeNavTab === 'sign-up';

    if (
      isAuthenticationScreen ||
      activeNavTab === 'citizen-dashboard'
    ) {
      const destination = workspaceByRole[currentUser.role];

      if (activeNavTab !== destination) {
        setActiveNavTab(destination);
      }
    }
  }, [currentUser, activeNavTab, setActiveNavTab]);

  const handleNavigate = (
    tab: string,
    complaintId?: string
  ) => {
    if (complaintId) {
      setSelectedComplaintId(complaintId);
    }

    setActiveNavTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToFeedback = (complaintId: string) => {
    setFeedbackComplaintId(complaintId);
    setSelectedComplaintId(complaintId);
    setActiveNavTab('citizen-feedback');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToEvidenceGuard = (
    complaintId: string
  ) => {
    setEvidenceComplaintId(complaintId);
    setSelectedComplaintId(complaintId);
    setActiveNavTab('evidence-guard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar
        currentTab={activeNavTab}
        onTabChange={(tab) => handleNavigate(tab)}
      />

      <main className="flex-1">
        {activeNavTab === 'public-portal' && (
          <PublicPortal onNavigate={handleNavigate} />
        )}

        {activeNavTab === 'report-issue' && (
          <ReportIssue
            onSuccess={(newId) =>
              handleNavigate('track-complaint', newId)
            }
            onCancel={() =>
              handleNavigate('public-portal')
            }
          />
        )}

        {activeNavTab === 'track-complaint' && (
          <TrackComplaint
            onNavigateToFeedback={handleNavigateToFeedback}
            onNavigateToExplorer={() =>
              handleNavigate('community-feed')
            }
          />
        )}

        {activeNavTab === 'community-feed' && (
          <PublicExplorer
            onNavigateToFeedback={handleNavigateToFeedback}
            onNavigateToReport={() =>
              handleNavigate('report-issue')
            }
            onNavigateToEvidenceGuard={
              handleNavigateToEvidenceGuard
            }
          />
        )}

        {activeNavTab === 'authority' && (
          <AuthorityWorkspace
            onNavigateToEvidenceGuard={
              handleNavigateToEvidenceGuard
            }
            onNavigateToFeedback={handleNavigateToFeedback}
          />
        )}

        {activeNavTab === 'field-team' && (
          <MaintenanceTasks
            onNavigateToEvidenceGuard={
              handleNavigateToEvidenceGuard
            }
          />
        )}

        {activeNavTab === 'evidence-guard' && (
          <EvidenceReview
            complaintId={evidenceComplaintId}
            onBack={() => handleNavigate('authority')}
            onSuccess={() =>
              handleNavigate('community-feed')
            }
          />
        )}

        {activeNavTab === 'citizen-feedback' && (
          <CitizenFeedback
            complaintId={feedbackComplaintId}
            onBack={() =>
              handleNavigate(
                'track-complaint',
                feedbackComplaintId
              )
            }
            onSuccess={() =>
              handleNavigate(
                'track-complaint',
                feedbackComplaintId
              )
            }
          />
        )}

        {activeNavTab === 'citizen-dashboard' && (
          <CitizenDashboard onNavigate={handleNavigate} />
        )}

        {activeNavTab === 'admin' && (
          <AdminWorkspace />
        )}

        {activeNavTab === 'sign-in' && (
          <SignIn
            onSuccess={() =>
              handleNavigate('citizen-dashboard')
            }
            onNavigateToSignUp={() =>
              handleNavigate('sign-up')
            }
          />
        )}

        {activeNavTab === 'sign-up' && (
          <SignUp
            onSuccess={() =>
              handleNavigate('citizen-dashboard')
            }
            onNavigateToSignIn={() =>
              handleNavigate('sign-in')
            }
          />
        )}
      </main>

      <Footer
        onNavigateToNotice={() =>
          handleNavigate('public-portal')
        }
      />

      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
