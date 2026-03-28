import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl } from '../services/tmdb';
import { uploadProfileAvatar } from '../services/storage';
import { updateUserProfile } from '../services/firestore';
import './Profile.css';

// ─── Avatar helpers ────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  '#5B7FFF', '#7C3AED', '#DB2777', '#DC2626',
  '#D97706', '#059669', '#0891B2', '#65A30D',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Component helpers ─────────────────────────────────────────────────────────

const RESET_TAPS = 7;
const RESET_WINDOW_MS = 3000;

type Tab = 'all' | 'genre';

// ─── ProfileAvatar sub-component ──────────────────────────────────────────────

interface ProfileAvatarProps {
  photoURL: string | null;
  displayName: string;
  uid: string;
  onUploaded: () => void;
}

function ProfileAvatar({ photoURL, displayName, uid, onUploaded }: ProfileAvatarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadProfileAvatar(uid, file);
      onUploaded();
    } catch (err) {
      console.error('Avatar upload failed:', err);
    } finally {
      setUploading(false);
      // Reset so the same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const initials = getInitials(displayName);
  const bgColor = getAvatarColor(uid || displayName);

  return (
    <button
      className={`profile__avatar-btn ${uploading ? 'profile__avatar-btn--uploading' : ''}`}
      onClick={() => fileInputRef.current?.click()}
      aria-label="Change profile photo"
    >
      {uploading ? (
        <div className="profile__avatar-spinner" />
      ) : photoURL ? (
        <img src={photoURL} alt={displayName} className="profile__avatar-img" />
      ) : (
        <div
          className="profile__avatar-initials"
          style={{ background: bgColor }}
        >
          {initials}
        </div>
      )}
      <div className="profile__avatar-edit-hint">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <path d="M12 2l2 2-9 9H3v-2L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </button>
  );
}

// ─── Main Profile component ────────────────────────────────────────────────────

const Profile = () => {
  const navigate = useNavigate();
  const { movies, watchlist, getRankedMovies, resetProfile } = useUser();
  const { profile, firebaseUser, refreshProfile } = useAuth();

  const [tab, setTab] = useState<Tab>('all');
  const [watchlistExpanded, setWatchlistExpanded] = useState(false);
  const [expandedGenre, setExpandedGenre] = useState<string | null>(null);

  // Name edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const handleEditStart = () => {
    setEditName(profile?.displayName ?? '');
    setIsEditing(true);
  };

  const handleSaveName = async () => {
    const trimmed = editName.trim();
    if (!firebaseUser || !trimmed) return;
    setSavingName(true);
    await updateUserProfile(firebaseUser.uid, { displayName: trimmed });
    await refreshProfile();
    setSavingName(false);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName('');
  };

  // Hidden reset state
  const [showReset, setShowReset] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleStatsTap = () => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    if (tapCountRef.current >= RESET_TAPS) {
      tapCountRef.current = 0;
      setShowReset(true);
      return;
    }
    tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, RESET_WINDOW_MS);
  };

  const handleResetConfirm = async () => {
    setResetting(true);
    await resetProfile();
    setResetting(false);
    setResetConfirm(false);
    setShowReset(false);
  };

  const rankedMovies = getRankedMovies();
  const totalComparisons = profile?.comparisonCount ?? 0;

  // Watchlist sorted most-recently-added first
  const sortedWatchlist = [...watchlist].sort((a, b) => b.addedAt - a.addedAt);

  // Group ranked movies by genre for "By Genre" tab
  const genreGroups = (() => {
    const map = new Map<string, typeof rankedMovies>();
    for (const m of rankedMovies) {
      const genres = m.tmdbGenreNames.length > 0 ? m.tmdbGenreNames : ['Other'];
      for (const g of genres) {
        const existing = map.get(g) ?? [];
        existing.push(m);
        map.set(g, existing);
      }
    }
    return Array.from(map.entries())
      .map(([name, ms]) => ({ name, movies: ms }))
      .sort((a, b) => b.movies.length - a.movies.length);
  })();

  return (
    <div className="profile">

      {/* ── Header: back + edit toggle ────────────────────────────────── */}
      <div className="profile__header-bar">
        <button className="profile__back" onClick={() => navigate('/')} aria-label="Go back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {!isEditing ? (
          <button className="profile__edit-btn" onClick={handleEditStart} aria-label="Edit profile">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            Edit
          </button>
        ) : (
          <div className="profile__edit-actions">
            <button className="profile__cancel-btn" onClick={handleCancelEdit} disabled={savingName}>
              Cancel
            </button>
            <button
              className="profile__save-btn"
              onClick={handleSaveName}
              disabled={savingName || !editName.trim()}
            >
              {savingName ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* ── Identity: avatar + name ───────────────────────────────────── */}
      <div className="profile__identity">
        <ProfileAvatar
          photoURL={profile?.photoURL ?? null}
          displayName={profile?.displayName ?? 'Movie Fan'}
          uid={firebaseUser?.uid ?? profile?.id ?? ''}
          onUploaded={refreshProfile}
        />
        <div className="profile__name-block">
          {isEditing ? (
            <input
              className="profile__name-input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') handleCancelEdit();
              }}
              autoFocus
              maxLength={48}
              placeholder="Your name"
              spellCheck={false}
            />
          ) : (
            <h1 className="profile__display-name">{profile?.displayName ?? 'Movie Fan'}</h1>
          )}
          <p className="profile__email">{profile?.email ?? ''}</p>
        </div>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────────── */}
      <div className="profile__stats" onClick={handleStatsTap}>
        <div className="profile__stat">
          <span className="profile__stat-value">{rankedMovies.length}</span>
          <span className="profile__stat-label">Ranked</span>
        </div>
        <div className="profile__stat">
          <span className="profile__stat-value">{totalComparisons}</span>
          <span className="profile__stat-label">Comparisons</span>
        </div>
        <div className="profile__stat">
          <span className="profile__stat-value">{movies.length}</span>
          <span className="profile__stat-label">Total</span>
        </div>
      </div>

      {/* ── Hidden reset panel ────────────────────────────────────────── */}
      {showReset && (
        <div className="profile__reset-panel">
          {!resetConfirm ? (
            <button className="profile__reset-btn" onClick={() => setResetConfirm(true)}>
              Reset Profile
            </button>
          ) : (
            <div className="profile__reset-confirm">
              <span className="profile__reset-warning">
                Deletes all ratings & comparisons. Cannot be undone.
              </span>
              <div className="profile__reset-actions">
                <button
                  className="profile__reset-cancel"
                  onClick={() => { setResetConfirm(false); setShowReset(false); }}
                  disabled={resetting}
                >Cancel</button>
                <button
                  className="profile__reset-confirm-btn"
                  onClick={handleResetConfirm}
                  disabled={resetting}
                >{resetting ? 'Resetting…' : 'Yes, reset'}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Watchlist section ─────────────────────────────────────────── */}
      {sortedWatchlist.length > 0 && (
        <div className="profile__watchlist-section">
          <button
            className="profile__watchlist-header"
            onClick={() => setWatchlistExpanded((v) => !v)}
          >
            <div className="profile__watchlist-title-row">
              <span className="profile__watchlist-title">Watchlist</span>
              <span className="profile__watchlist-count">{sortedWatchlist.length}</span>
            </div>
            <svg
              className={`profile__section-arrow ${watchlistExpanded ? 'profile__section-arrow--open' : ''}`}
              width="20" height="20" viewBox="0 0 20 20" fill="none"
            >
              <path d="M7 8l3 3 3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Collapsed: horizontal poster strip */}
          {!watchlistExpanded && (
            <div className="profile__poster-strip">
              {sortedWatchlist.map((item) => (
                <button
                  key={item.tmdbId}
                  className="profile__strip-poster"
                  onClick={() => navigate(`/rate/${item.tmdbId}`)}
                >
                  {item.posterPath ? (
                    <img
                      src={getImageUrl(item.posterPath, 'w185')}
                      alt={item.title}
                      className="profile__strip-poster-img"
                    />
                  ) : (
                    <div className="profile__strip-poster-placeholder">🎬</div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Expanded: sorted list most-recent first */}
          {watchlistExpanded && (
            <div className="profile__watchlist-list">
              {sortedWatchlist.map((item) => (
                <button
                  key={item.tmdbId}
                  className="profile__watchlist-item"
                  onClick={() => navigate(`/rate/${item.tmdbId}`)}
                >
                  {item.posterPath ? (
                    <img
                      src={getImageUrl(item.posterPath, 'w92')}
                      alt={item.title}
                      className="profile__watchlist-poster"
                    />
                  ) : (
                    <div className="profile__watchlist-poster-placeholder">🎬</div>
                  )}
                  <div className="profile__watchlist-info">
                    <span className="profile__watchlist-name">{item.title}</span>
                    <span className="profile__watchlist-added">
                      Added {new Date(item.addedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="profile__watchlist-chevron">
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab bar ──────────────────────────────────────────────────── */}
      <div className="profile__tabs">
        <button
          className={`profile__tab ${tab === 'all' ? 'profile__tab--active' : ''}`}
          onClick={() => setTab('all')}
        >
          All Movies
        </button>
        <button
          className={`profile__tab ${tab === 'genre' ? 'profile__tab--active' : ''}`}
          onClick={() => setTab('genre')}
        >
          By Genre
        </button>
      </div>

      {/* ── Tab content ──────────────────────────────────────────────── */}
      {rankedMovies.length === 0 ? (
        <div className="profile__empty">
          <p>No movies ranked yet.</p>
          <button className="profile__cta" onClick={() => navigate('/')}>
            Rank Your First Movie
          </button>
        </div>
      ) : (
        <>
          {/* All Movies tab */}
          {tab === 'all' && (
            <div className="profile__all-movies">
              {rankedMovies.map((m) => (
                <button
                  key={m.tmdbId}
                  className="profile__rank-item profile__rank-item--clickable"
                  onClick={() => navigate(`/rate/${m.tmdbId}`)}
                >
                  <span className="profile__rank-number">#{m.rank}</span>
                  {m.posterPath ? (
                    <img
                      src={getImageUrl(m.posterPath, 'w92')}
                      alt={m.title}
                      className="profile__rank-poster"
                    />
                  ) : (
                    <div className="profile__rank-poster-placeholder" />
                  )}
                  <div className="profile__rank-info">
                    <span className="profile__rank-title">{m.title}</span>
                    {m.releaseDate && (
                      <span className="profile__rank-year">
                        {new Date(m.releaseDate).getFullYear()}
                      </span>
                    )}
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="profile__rank-chevron">
                    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ))}
            </div>
          )}

          {/* By Genre tab */}
          {tab === 'genre' && (
            <div className="profile__genre-sections">
              {genreGroups.map(({ name, movies: gMovies }) => {
                const isExpanded = expandedGenre === name;
                return (
                  <div key={name} className="profile__genre">
                    <button
                      className="profile__genre-header"
                      onClick={() => setExpandedGenre(isExpanded ? null : name)}
                    >
                      <div className="profile__genre-info">
                        <h2 className="profile__genre-name">{name}</h2>
                        <span className="profile__genre-count">
                          {gMovies.length} movie{gMovies.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <svg
                        className={`profile__genre-arrow ${isExpanded ? 'profile__genre-arrow--expanded' : ''}`}
                        width="20" height="20" viewBox="0 0 20 20" fill="none"
                      >
                        <path d="M7 8l3 3 3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>

                    {/* Preview: top 3 collapsed */}
                    {!isExpanded && (
                      <div className="profile__genre-preview">
                        {gMovies.slice(0, 3).map((m) => (
                          <button
                            key={m.tmdbId}
                            className="profile__preview-movie"
                            onClick={() => navigate(`/rate/${m.tmdbId}`)}
                          >
                            <span className="profile__preview-rank">#{m.rank}</span>
                            {m.posterPath ? (
                              <img
                                src={getImageUrl(m.posterPath, 'w92')}
                                alt={m.title}
                                className="profile__preview-poster"
                              />
                            ) : (
                              <div className="profile__preview-poster-placeholder" />
                            )}
                            <div className="profile__preview-info">
                              <span className="profile__preview-title">{m.title}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Full list expanded — all clickable */}
                    {isExpanded && (
                      <div className="profile__genre-rankings">
                        {gMovies.map((m) => (
                          <button
                            key={m.tmdbId}
                            className="profile__rank-item profile__rank-item--clickable"
                            onClick={() => navigate(`/rate/${m.tmdbId}`)}
                          >
                            <span className="profile__rank-number">#{m.rank}</span>
                            {m.posterPath ? (
                              <img
                                src={getImageUrl(m.posterPath, 'w92')}
                                alt={m.title}
                                className="profile__rank-poster"
                              />
                            ) : (
                              <div className="profile__rank-poster-placeholder" />
                            )}
                            <div className="profile__rank-info">
                              <span className="profile__rank-title">{m.title}</span>
                            </div>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="profile__rank-chevron">
                              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Profile;
