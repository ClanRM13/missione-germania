import { useCallback, useEffect, useRef, useState } from "react";
import {
  confirmSignIn,
  fetchAuthSession,
  getCurrentUser,
  signIn,
  signOut,
} from "aws-amplify/auth";
import "./App.css";

import { apiBaseUrl, clanBadges, missions, routeStops } from "./data";
const logoUrl = `${import.meta.env.BASE_URL}sirio.png`;
const logoFSE = `${import.meta.env.BASE_URL}giglio.png`;

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthState = "loading" | "signedOut" | "forceChangePassword" | "signedIn";

interface Proof {
  id: string;
  username: string;
  missionId: string;
  missionTitle: string;
  fileUrl: string;
  submittedAt: string;
}

type Badge = (typeof clanBadges)[number];

function getBadgeImageUrl(badge: Badge): string {
  return (badge as Badge & { imageUrl?: string }).imageUrl ?? "";
}

function getBadgeUnlockHint(badge: Badge): string {
  return (
    (badge as Badge & { unlockHint?: string }).unlockHint ??
    "Completa le missioni richieste per sbloccare questo distintivo."
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchUserProgress(username: string): Promise<string[]> {
  const response = await fetch(`${apiBaseUrl}/me/progress?username=${username}`);

  if (!response.ok) {
    throw new Error("Errore caricamento progressi");
  }

  const data = await response.json();
  return data.completedMissions ?? [];
}

async function fetchUserAchievements(username: string): Promise<string[]> {
  const response = await fetch(
    `${apiBaseUrl}/me/achievements?username=${username}`
  );

  if (!response.ok) {
    throw new Error("Errore caricamento distintivi");
  }

  const data = await response.json();
  return data.achievements ?? [];
}

async function uploadProof(
  file: File,
  username: string,
  missionId: string,
  category: string
): Promise<void> {
  const presignResponse = await fetch(`${apiBaseUrl}/presign-upload`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      username,
      missionId,
      category,
      fileSize: file.size,
    }),
  });

  if (!presignResponse.ok) {
    const data = await presignResponse.json().catch(() => null);
    throw new Error(
      data?.message ?? "Errore nella richiesta dell'URL di upload"
    );
  }

  const { uploadUrl } = await presignResponse.json();

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "content-type": file.type },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error("Errore durante l'upload su S3");
  }
}

async function fetchPendingProofs(): Promise<Proof[]> {
  const response = await fetch(`${apiBaseUrl}/proofs/pending`);

  if (!response.ok) {
    throw new Error("Errore nel caricamento delle prove");
  }

  return response.json();
}

async function approveProof(proofId: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/proofs/${proofId}/approve`, {
    method: "POST",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message ?? "Errore nell'approvazione");
  }
}

async function rejectProof(proofId: string, reason: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/proofs/${proofId}/reject`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message ?? "Errore nel rifiuto della prova");
  }
}

function getMissionTitle(missionId: string): string {
  return missions.find((mission) => mission.id === missionId)?.title ?? missionId;
}

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [username, setUsername] = useState("");
  const [groups, setGroups] = useState<string[]>([]);
  const [loginUsername, setLoginUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");

  const isAdmin = groups.includes("admins");

  async function loadSession() {
    try {
      const user = await getCurrentUser();
      const session = await fetchAuthSession();
      const cognitoGroups = session.tokens?.idToken?.payload?.["cognito:groups"];

      setUsername(user.username);
      setGroups(Array.isArray(cognitoGroups) ? cognitoGroups.map(String) : []);
      setAuthState("signedIn");
    } catch {
      setAuthState("signedOut");
    }
  }

  useEffect(() => {
    loadSession();
  }, []);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    try {
      const result = await signIn({ username: loginUsername, password });

      if (
        result.nextStep.signInStep ===
        "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED"
      ) {
        setAuthState("forceChangePassword");
        return;
      }

      await loadSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore login");
    }
  }

  async function handleConfirmNewPassword(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    try {
      await confirmSignIn({ challengeResponse: newPassword });
      await loadSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore cambio password");
    }
  }

  async function handleLogout() {
    await signOut();
    setUsername("");
    setGroups([]);
    setAuthState("signedOut");
  }

  if (authState === "loading") {
    return (
      <main className="page center">
        <p className="muted">Caricamento...</p>
      </main>
    );
  }

  if (authState === "forceChangePassword") {
    return (
      <main className="page center">
        <section className="card login-card">
          <div className="crest">🔑</div>
          <h1>Imposta nuova password</h1>
          <p className="muted">Scegli una password sicura per continuare</p>

          <form onSubmit={handleConfirmNewPassword}>
            <input
              type="password"
              placeholder="Nuova password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />

            <button type="submit">Conferma password</button>
          </form>

          {error && <p className="error">{error}</p>}
        </section>
      </main>
    );
  }

  if (authState === "signedOut") {
    return (
      <main className="home-page">
        <section className="home-shell">
          <div className="home-brand">
            <img
              src={logoUrl}
              alt="Logo Clan Sirio"
              className="home-giglio"
            />

            <p className="home-kicker">Missione Germania 2026</p>

            <h1>
              Passaporto
              <span>Interrail</span>
            </h1>

            <p className="home-clan">Clan Sirio</p>
          </div>

          <section className="home-login-card">
            <div className="home-login-header">
              <img
                src={logoFSE}
                alt="Logo Clan Sirio"
                className="home-login-symbol"
              />

              <div>
                <p>Accesso riservato</p>
                <h2>Campo base</h2>
              </div>
            </div>

            <form onSubmit={handleLogin} className="home-login-form">
              <label>
                Username
                <input
                  placeholder="Username"
                  value={loginUsername}
                  onChange={(event) => setLoginUsername(event.target.value)}
                  required
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>

              <button type="submit">Entra</button>
            </form>

            {error && <p className="error">{error}</p>}
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="topbar">

        <div className="topbar-actions">
          <a
            className="duolingo-button"
            href="https://www.duolingo.com/learn"
            target="_blank"
            rel="noreferrer"
          >
            🦉 Apri Duolingo
          </a>

          <button className="secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {isAdmin ? (
        <AdminDashboard username={username} />
      ) : (
        <ScoutDashboard username={username} />
      )}
    </main>
  );
}

// ─── Achievement Grid ─────────────────────────────────────────────────────────

function BadgeGrid({
  unlockedAchievementIds,
}: {
  unlockedAchievementIds: string[];
}) {
  const [selected, setSelected] = useState<Badge | null>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelected(null);
      }
    }

    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <>
      <div className="achievement-grid">
        {clanBadges.map((badge) => {
          const unlocked = unlockedAchievementIds.includes(badge.id);
          const imageUrl = getBadgeImageUrl(badge);

          return (
            <button
              key={badge.id}
              type="button"
              className={`achievement-tile ${
                unlocked ? "unlocked" : "locked"
              }`}
              onClick={() => setSelected(badge)}
            >
              <div className="achievement-icon-frame">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={badge.title}
                    className="achievement-icon-image"
                  />
                ) : (
                  <div className="achievement-placeholder">
                    <span>{unlocked ? badge.emoji : "🔒"}</span>
                  </div>
                )}

                {unlocked && (
                  <div className="achievement-check">
                    <svg viewBox="0 0 12 12">
                      <polyline points="2,6 5,9 10,3" />
                    </svg>
                  </div>
                )}
              </div>

              <strong>{badge.title}</strong>
            </button>
          );
        })}
      </div>

      {selected && (
        <div
          className="achievement-modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSelected(null);
            }
          }}
        >
          <div className="achievement-modal">
            <button
              type="button"
              className="achievement-modal-close"
              onClick={() => setSelected(null)}
            >
              ✕
            </button>

            <div
              className={`achievement-modal-icon ${
                unlockedAchievementIds.includes(selected.id)
                  ? "unlocked"
                  : "locked"
              }`}
            >
              {getBadgeImageUrl(selected) ? (
                <img src={getBadgeImageUrl(selected)} alt={selected.title} />
              ) : (
                <span>
                  {unlockedAchievementIds.includes(selected.id)
                    ? selected.emoji
                    : "🔒"}
                </span>
              )}
            </div>

            <p className="eyebrow">
              {unlockedAchievementIds.includes(selected.id)
                ? "Distintivo sbloccato"
                : "Distintivo bloccato"}
            </p>

            <h2>{selected.title}</h2>

            <p className="achievement-modal-description">
              {selected.description}
            </p>

            <div className="achievement-modal-requirement">
              <span>Cosa fare</span>
              <strong>{getBadgeUnlockHint(selected)}</strong>
            </div>

            <div
              className={`achievement-modal-status ${
                unlockedAchievementIds.includes(selected.id)
                  ? "unlocked"
                  : "locked"
              }`}
            >
              {unlockedAchievementIds.includes(selected.id)
                ? "✓ Sbloccato"
                : "🔒 Non ancora sbloccato"}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Scout Dashboard ──────────────────────────────────────────────────────────

function ScoutDashboard({ username }: { username: string }) {
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [uploadError, setUploadError] = useState("");
  const [selectedMissionId, setSelectedMissionId] = useState("");
  const [completedMissionIds, setCompletedMissionIds] = useState<string[]>([]);
  const [unlockedAchievementIds, setUnlockedAchievementIds] = useState<string[]>(
    []
  );
  const [newAchievementId, setNewAchievementId] = useState<string | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);

  const previousAchievementIdsRef = useRef<string[] | null>(null);

  const completedMissions = missions.filter((mission) =>
    completedMissionIds.includes(mission.id)
  );

  const totalMissions = missions.length;

  const progressPercentage = Math.round(
    (completedMissions.length / totalMissions) * 100
  );

  const currentStopIndex = Math.min(
    Math.floor(completedMissions.length / 3),
    routeStops.length - 1
  );

  const currentStop = routeStops[currentStopIndex];

  const selectedStop =
    routeStops.find((stop) => stop.id === selectedStopId) ?? currentStop;

  const selectedStopIndex = routeStops.findIndex(
    (stop) => stop.id === selectedStop.id
  );

  const selectedStopIsUnlocked = selectedStopIndex <= currentStopIndex;
  const selectedStopIsCurrent = selectedStopIndex === currentStopIndex;

  const displayedMissions = missions.filter(
    (mission) => mission.stopId === selectedStop.id
  );

  const currentMissions = missions.filter(
    (mission) => mission.stopId === currentStop.id
  );

  const availableMissions = currentMissions.filter(
    (mission) => !completedMissionIds.includes(mission.id)
  );

  const availableMissionKey = availableMissions
    .map((mission) => mission.id)
    .join("|");

  const newAchievement = clanBadges.find(
    (badge) => badge.id === newAchievementId
  );

  const loadProgress = useCallback(async () => {
    try {
      const progress = await fetchUserProgress(username);
      setCompletedMissionIds(progress);

      const achievements = await fetchUserAchievements(username);

      const previousAchievementIds = previousAchievementIdsRef.current;

      const newlyUnlocked = achievements.find(
        (id) => !previousAchievementIds?.includes(id)
      );

      if (previousAchievementIds && newlyUnlocked) {
        setNewAchievementId(newlyUnlocked);
      }

      previousAchievementIdsRef.current = achievements;
      setUnlockedAchievementIds(achievements);
    } catch (error) {
      console.error(error);
    }
  }, [username]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadProgress();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadProgress]);

  useEffect(() => {
    if (!selectedStopId) {
      setSelectedStopId(currentStop.id);
    }
  }, [currentStop.id, selectedStopId]);

  useEffect(() => {
    if (!selectedStopIsCurrent || availableMissions.length === 0) {
      setSelectedMissionId("");
      return;
    }

    const selectedMissionStillAvailable = availableMissions.some(
      (mission) => mission.id === selectedMissionId
    );

    if (!selectedMissionId || !selectedMissionStillAvailable) {
      setSelectedMissionId(availableMissions[0].id);
    }
  }, [
    selectedMissionId,
    availableMissionKey,
    selectedStopIsCurrent,
    availableMissions.length,
  ]);

  useEffect(() => {
    return () => {
      if (proofPreview) {
        URL.revokeObjectURL(proofPreview);
      }
    };
  }, [proofPreview]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!selectedStopIsCurrent) {
      setUploadStatus("error");
      setUploadError("Puoi caricare prove solo per la tappa attuale.");
      return;
    }

    const maxSizeMb = 5;
    const maxSizeBytes = maxSizeMb * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      setUploadStatus("error");
      setUploadError(`File troppo grande. Massimo ${maxSizeMb} MB.`);
      return;
    }

    if (proofPreview) {
      URL.revokeObjectURL(proofPreview);
    }

    setSelectedFile(file);
    setProofPreview(URL.createObjectURL(file));
    setUploadStatus("idle");
    setUploadError("");
  }

  async function handleUpload() {
    if (!selectedFile) {
      return;
    }

    const selectedMission = missions.find(
      (mission) => mission.id === selectedMissionId
    );

    if (!selectedMission) {
      setUploadStatus("error");
      setUploadError("Missione non valida");
      return;
    }

    setUploadStatus("uploading");
    setUploadError("");

    try {
      await uploadProof(
        selectedFile,
        username,
        selectedMission.id,
        selectedMission.category
      );

      setUploadStatus("success");
      setSelectedFile(null);

      if (proofPreview) {
        URL.revokeObjectURL(proofPreview);
        setProofPreview(null);
      }

      await loadProgress();
    } catch (err) {
      setUploadStatus("error");
      setUploadError(err instanceof Error ? err.message : "Errore upload");
    }
  }

  return (
    <section className="scout-dashboard">
      <article className="scout-hero">

        <div className="scout-hero-content">
          <p className="eyebrow">Passaporto Interrail</p>

          <h2>{username}</h2>

          <p className="scout-hero-route">
            📍 {currentStop.name} · Direzione Dresda
          </p>

          <div className="scout-hero-progress">
            <div>
              <strong>{completedMissions.length}</strong>
              <span>missioni</span>
            </div>

            <div>
              <strong>{currentStopIndex + 1}</strong>
              <span>tappa</span>
            </div>

            <div>
              <strong>{unlockedAchievementIds.length}</strong>
              <span>badge</span>
            </div>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <p className="progress-label">
            {progressPercentage}% del viaggio completato
          </p>
        </div>
      </article>

      <div className="dashboard-row">
        <article className="card rail-card">
          <div className="rail-card-header">
            <div>
              <h2>Linea del viaggio</h2>
            </div>

            <div className="rail-destination-badge">
              <span>Fermata selezionata</span>
              <strong>{selectedStop.name}</strong>
            </div>
          </div>

          <div className="railway-map">
            <div className="railway-line" />

            {routeStops.map((stop, index) => {
              const completed = index < currentStopIndex;
              const current = index === currentStopIndex;
              const upcoming = index > currentStopIndex;
              const selected = selectedStop.id === stop.id;

              return (
                <button
                  type="button"
                  key={stop.id}
                  className={`railway-stop ${completed ? "completed" : ""} ${
                    current ? "current" : ""
                  } ${upcoming ? "upcoming" : ""} ${
                    selected ? "selected" : ""
                  }`}
                  onClick={() => setSelectedStopId(stop.id)}
                >
                  <div className="railway-node-wrap">
                    <div className="railway-node">
                      {completed ? "✓" : current ? "🚂" : ""}
                    </div>
                  </div>

                  <div className="railway-stop-content">
                    <div className="railway-stop-top">
                      <strong>{stop.name}</strong>

                      <div className="railway-stop-meta">
                        <span>{stop.date}</span>

                        <span className="railway-stop-status">
                          {completed
                            ? "Completata"
                            : current
                            ? "Attuale"
                            : "Futura"}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </article>

        <article className="card achievements-card">
          <h2>Achievement</h2>

          <BadgeGrid unlockedAchievementIds={unlockedAchievementIds} />
        </article>
      </div>

      <article className="card missions-card">
        <p className="eyebrow">
          {selectedStopIsUnlocked ? "Missioni di tappa" : "Tappa bloccata"}
        </p>

        <h2>
          {selectedStopIsUnlocked ? "" : "🔒 "}
          {selectedStop.name}
        </h2>

        {!selectedStopIsUnlocked && (
          <p className="muted">
            Questa tappa non è ancora sbloccata. Puoi vedere le missioni, ma
            potrai caricare prove solo quando ci arriverai.
          </p>
        )}

        <div className="mission-list">
          {displayedMissions.map((mission) => {
            const completed = completedMissionIds.includes(mission.id);

            return (
              <div
                key={mission.id}
                className={`mission-item ${completed ? "completed" : ""} ${
                  !selectedStopIsUnlocked ? "locked" : ""
                }`}
              >
                <div className="mission-check">
                  {completed ? "✓" : !selectedStopIsUnlocked ? "🔒" : ""}
                </div>

                <div>
                  <strong>{mission.title}</strong>
                  <p>{mission.description}</p>
                  <small>{mission.difficulty}</small>
                </div>
              </div>
            );
          })}
        </div>
      </article>

      <article className="upload-proof">
        <div>
          <h3>Carica prova</h3>

          {!selectedStopIsCurrent && (
            <p className="upload-status">
              Seleziona la tappa attuale ({currentStop.name}) per caricare una
              prova.
            </p>
          )}

          <label className="select-label">
            Missione

            <select
              value={selectedMissionId}
              onChange={(event) => setSelectedMissionId(event.target.value)}
              disabled={!selectedStopIsCurrent || availableMissions.length === 0}
            >
              {!selectedStopIsCurrent ? (
                <option value="">Tappa non attiva</option>
              ) : availableMissions.length === 0 ? (
                <option value="">Nessuna missione disponibile</option>
              ) : (
                availableMissions.map((mission) => (
                  <option key={mission.id} value={mission.id}>
                    {mission.title}
                  </option>
                ))
              )}
            </select>
          </label>

          <p>Scatta una foto della prova oppure carica uno screenshot.</p>

          <div className="proof-actions">
  <label
    className={`file-button ${
      !selectedStopIsCurrent ? "disabled" : ""
    }`}
  >
    📸 Scatta foto
    <input
      type="file"
      accept="image/*"
      capture="environment"
      onChange={handleFileChange}
      disabled={!selectedStopIsCurrent}
    />
  </label>

  <label
    className={`file-button secondary-file-button ${
      !selectedStopIsCurrent ? "disabled" : ""
    }`}
  >
    🖼️ Carica screenshot
    <input
      type="file"
      accept="image/*"
      onChange={handleFileChange}
      disabled={!selectedStopIsCurrent}
    />
  </label>
</div>
        </div>

        {proofPreview && (
          <img
            className="proof-preview"
            src={proofPreview}
            alt="Anteprima prova"
          />
        )}

        {selectedFile && uploadStatus !== "success" && (
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploadStatus === "uploading"}
          >
            {uploadStatus === "uploading" ? "Caricamento..." : "Invia prova"}
          </button>
        )}

        {uploadStatus === "success" && (
          <p className="upload-status">✅ Prova caricata correttamente!</p>
        )}

        {uploadStatus === "error" && (
          <p className="upload-status error">❌ {uploadError}</p>
        )}
      </article>

      {newAchievement && (
        <div className="achievement-unlock-overlay">
          <div className="achievement-unlock-card">
            <p className="eyebrow">Nuovo distintivo</p>

            <div className="achievement-unlock-emoji">
              {newAchievement.emoji}
            </div>

            <h2>{newAchievement.title}</h2>

            <p>{newAchievement.description}</p>

            <button onClick={() => setNewAchievementId(null)}>
              Continua la missione
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

function AdminDashboard({ username }: { username: string }) {
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loadingProofs, setLoadingProofs] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionProofId, setActionProofId] = useState<string | null>(null);
  const [rejectCandidate, setRejectCandidate] = useState<Proof | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    loadProofs();
  }, []);

  async function loadProofs() {
    setLoadingProofs(true);
    setLoadError("");

    try {
      const data = await fetchPendingProofs();
      setProofs(data);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Errore nel caricamento"
      );
    } finally {
      setLoadingProofs(false);
    }
  }

  async function handleApprove(proof: Proof) {
    setActionProofId(proof.id);

    try {
      await approveProof(proof.id);
      setProofs((prev) => prev.filter((item) => item.id !== proof.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Errore approvazione");
    } finally {
      setActionProofId(null);
    }
  }

  function openRejectModal(proof: Proof) {
    setRejectCandidate(proof);
    setRejectReason("");
  }

  function closeRejectModal() {
    setRejectCandidate(null);
    setRejectReason("");
  }

  async function confirmReject() {
    if (!rejectCandidate) return;

    const reason = rejectReason.trim();

    if (!reason) {
      alert("Inserisci un motivo per il rifiuto.");
      return;
    }

    setActionProofId(rejectCandidate.id);

    try {
      await rejectProof(rejectCandidate.id, reason);
      setProofs((prev) =>
        prev.filter((item) => item.id !== rejectCandidate.id)
      );
      closeRejectModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Errore rifiuto");
    } finally {
      setActionProofId(null);
    }
  }

  return (
    <section className="scout-dashboard">
      <article className="card hero-passport">
        <p className="eyebrow">Pannello di controllo</p>
        <h2>{username}</h2>
        <p className="hero-title">🛡 Capo Missione</p>
        <p className="muted">Gestisci le prove e i progressi del clan</p>
        <div className="stamp">ADMIN</div>
      </article>

      <article className="card missions-card">
        <p className="eyebrow">Prove in attesa di approvazione</p>
        <h2>Revisione</h2>

        {loadingProofs && <p className="muted">Caricamento prove...</p>}

        {loadError && <p className="error">{loadError}</p>}

        {!loadingProofs && !loadError && proofs.length === 0 && (
          <p className="muted">Nessuna prova in attesa. Tutto a posto! ✅</p>
        )}

        <div className="mission-list">
          {proofs.map((proof) => {
            const isBusy = actionProofId === proof.id;

            return (
              <div key={proof.id} className="proof-row">
                <div>
                  <strong>{proof.username}</strong>
                  <p className="muted">{getMissionTitle(proof.missionId)}</p>
                  <small>
                    {new Date(proof.submittedAt).toLocaleDateString("it-IT")}
                  </small>
                </div>

                <a
                  href={proof.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="button secondary"
                >
                  Visualizza
                </a>

                <button onClick={() => handleApprove(proof)} disabled={isBusy}>
                  {isBusy ? "..." : "Approva"}
                </button>

                <button
                  type="button"
                  className="secondary reject-button"
                  onClick={() => openRejectModal(proof)}
                  disabled={isBusy}
                >
                  Rifiuta
                </button>
              </div>
            );
          })}
        </div>

        {!loadingProofs && (
          <button
            type="button"
            className="secondary"
            onClick={loadProofs}
            style={{ marginTop: "16px" }}
          >
            Aggiorna
          </button>
        )}
      </article>

      {rejectCandidate && (
        <div
          className="reject-modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeRejectModal();
            }
          }}
        >
          <div className="reject-modal">
            <p className="eyebrow">Rifiuta prova</p>

            <h2>{getMissionTitle(rejectCandidate.missionId)}</h2>

            <p className="muted">
              Stai rifiutando la prova caricata da{" "}
              <strong>{rejectCandidate.username}</strong>.
            </p>

            <label className="select-label">
              Motivo del rifiuto
              <textarea
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Esempio: screenshot non leggibile"
                rows={4}
                autoFocus
              />
            </label>

            <div className="reject-modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={closeRejectModal}
                disabled={actionProofId === rejectCandidate.id}
              >
                Annulla
              </button>

              <button
                type="button"
                onClick={confirmReject}
                disabled={actionProofId === rejectCandidate.id}
              >
                {actionProofId === rejectCandidate.id
                  ? "Rifiuto..."
                  : "Conferma rifiuto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default App;