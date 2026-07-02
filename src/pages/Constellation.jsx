import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Search, Plus, Sparkles, Trash2, Users, Briefcase, Palette, Heart, Star, Loader2 } from "lucide-react";

const CONNECTION_TYPES = [
  { id: "friend",                label: "Friend",                icon: Users,   color: "#6B95C8", emoji: "🤝" },
  { id: "business_partner",     label: "Business Partner",      icon: Briefcase, color: "#B8902F", emoji: "💼" },
  { id: "creative_collaborator",label: "Creative Collaborator", icon: Palette,  color: "#C25E8F", emoji: "🎨" },
  { id: "lover",                 label: "Lover",                 icon: Heart,    color: "#C2606E", emoji: "💖" },
];

function ConnectionCard({ conn, onDelete, onReading }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reading, setReading] = useState(null);
  const type = CONNECTION_TYPES.find(t => t.id === conn.connection_type) || CONNECTION_TYPES[0];

  const handleDelete = async () => {
    setIsDeleting(true);
    await base44.entities.Connection.delete(conn.id);
    onDelete(conn.id);
  };

  const handleReading = async () => {
    setIsGenerating(true);
    const me = await base44.auth.me();
    const myProfile = me?.cosmic_profile || {};
    const theirProfile = conn.target_cosmic_profile || {};

    const prompt = `You are an oracle of cosmic synergy. Channel a short (3-4 sentences) synergy reading for two people connected as ${conn.connection_type.replace(/_/g,' ')}s.

Person A cosmic profile: ${JSON.stringify(myProfile)}
Person B (${conn.target_name || conn.target_email}) cosmic profile: ${JSON.stringify(theirProfile)}

Focus on the nature of their ${conn.connection_type.replace(/_/g,' ')} connection, what gifts they offer each other, and any growth edges. Be warm, poetic and insightful.`;

    const result = await base44.integrations.Core.InvokeLLM({ prompt });
    setReading(result);
    setIsGenerating(false);
  };

  return (
    <div className="glass-card p-5" style={{ border: `1px solid ${type.color}25` }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
            style={{ background: `${type.color}18`, border: `1px solid ${type.color}30` }}>
            {type.emoji}
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'rgba(61,52,80,0.95)', fontFamily: 'Space Grotesk, sans-serif' }}>
              {conn.target_name || conn.target_email}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(122,112,144,0.7)' }}>{conn.target_email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${type.color}18`, color: type.color, border: `1px solid ${type.color}30` }}>
            {type.label}
          </span>
          <button onClick={handleDelete} disabled={isDeleting} className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
            style={{ color: 'rgba(105,95,128,0.45)' }}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {conn.notes && (
        <p className="text-xs mb-3 italic" style={{ color: 'rgba(105,95,128,0.6)' }}>{conn.notes}</p>
      )}

      {reading ? (
        <div className="mt-3 p-3 rounded-xl text-xs leading-relaxed" style={{ background: 'rgba(138,114,184,0.08)', border: '1px solid rgba(138,114,184,0.2)', color: 'rgba(82,72,104,0.9)' }}>
          <p className="text-xs font-semibold mb-1.5" style={{ color: '#8A72B8' }}>✦ Synergy Reading</p>
          {reading}
        </div>
      ) : (
        <Button onClick={handleReading} disabled={isGenerating} size="sm" variant="outline"
          className="w-full mt-1 text-xs rounded-lg"
          style={{ borderColor: `${type.color}30`, color: type.color, background: `${type.color}08` }}>
          {isGenerating ? <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Reading the stars...</> : <><Star className="w-3 h-3 mr-1.5" />Oracle Synergy Reading</>}
        </Button>
      )}
    </div>
  );
}

export default function Constellation() {
  const { toast } = useToast();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [selectedType, setSelectedType] = useState("friend");
  const [notes, setNotes] = useState("");
  const [adding, setAdding] = useState(false);
  const [myEmail, setMyEmail] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [me, conns] = await Promise.all([
      base44.auth.me(),
      base44.entities.Connection.list()
    ]);
    setMyEmail(me?.email || "");
    setConnections(conns);
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    if (searchEmail.trim() === myEmail) {
      toast({ title: "That's you!", description: "You can't add yourself to your constellation.", variant: "destructive" });
      return;
    }
    setSearching(true);
    setSearchResult(null);
    // Search users by email
    const users = await base44.entities.User.filter({ email: searchEmail.trim() });
    if (users.length > 0) {
      setSearchResult({ found: true, user: users[0], cosmic_profile: users[0].cosmic_profile });
    } else {
      setSearchResult({ found: false });
    }
    setSearching(false);
  };

  const handleAdd = async () => {
    if (!searchResult?.found) return;
    const existing = connections.find(c => c.target_email === searchResult.user.email);
    if (existing) {
      toast({ title: "Already connected", description: "This person is already in your constellation." });
      return;
    }
    setAdding(true);
    const newConn = await base44.entities.Connection.create({
      target_email: searchResult.user.email,
      target_name: searchResult.user.full_name || searchResult.user.email,
      connection_type: selectedType,
      status: "active",
      notes: notes.trim() || undefined,
      target_cosmic_profile: searchResult.cosmic_profile || {}
    });
    setConnections(prev => [newConn, ...prev]);
    setSearchResult(null);
    setSearchEmail("");
    setNotes("");
    setAdding(false);
    toast({ title: "✦ Added to your constellation", description: `${searchResult.user.full_name || searchResult.user.email} has been added as a ${selectedType.replace(/_/g,' ')}.` });
  };

  const groupedConnections = CONNECTION_TYPES.map(type => ({
    ...type,
    items: connections.filter(c => c.connection_type === type.id)
  })).filter(g => g.items.length > 0);

  return (
    <div className="p-6 space-y-8 min-h-screen relative">
      <div className="orb-purple" style={{ top: '-40px', right: '10%' }} />
      <div className="max-w-3xl mx-auto relative z-10">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl pulse-glow"
              style={{ background: 'linear-gradient(135deg, #C4699A 0%, #C98A4E 50%, #8FA8D8 100%)' }}>
              🌌
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold gradient-text" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>My Constellation</h1>
              <p className="text-sm" style={{ color: 'rgba(138,114,184,0.7)' }}>Friends · Partners · Collaborators · Lovers</p>
            </div>
          </div>
          <p className="text-base max-w-xl mx-auto" style={{ color: 'rgba(105,95,128,0.7)' }}>
            Link cosmic profiles to reveal synergy readings — how your energies combine, what you offer each other, and where you grow together.
          </p>
        </div>

        {/* Search & Add */}
        <div className="glass-card p-6 mb-8" style={{ border: '1px solid rgba(138,114,184,0.2)' }}>
          <h3 className="text-base font-bold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'rgba(61,52,80,0.9)' }}>Add a Connection</h3>
          <p className="text-sm mb-4" style={{ color: 'rgba(105,95,128,0.6)' }}>Search by email address to find someone on Vibe Check.</p>

          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search by email..."
              value={searchEmail}
              onChange={e => setSearchEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={searching || !searchEmail.trim()} className="btn-cosmic rounded-xl px-5">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>

          {searchResult && !searchResult.found && (
            <div className="p-3 rounded-xl text-sm mb-4" style={{ background: 'rgba(255,100,100,0.08)', border: '1px solid rgba(255,100,100,0.2)', color: 'rgba(176,90,90,0.8)' }}>
              No user found with that email. You can invite them using the button in the sidebar.
            </div>
          )}

          {searchResult?.found && (
            <div className="p-4 rounded-xl mb-4" style={{ background: 'rgba(138,114,184,0.08)', border: '1px solid rgba(138,114,184,0.25)' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shrink-0"
                  style={{ background: 'linear-gradient(135deg, #C4699A, #8FA8D8)', color: 'white' }}>
                  {(searchResult.user.full_name || searchResult.user.email)[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'rgba(61,52,80,0.95)' }}>{searchResult.user.full_name || "—"}</p>
                  <p className="text-xs" style={{ color: 'rgba(122,112,144,0.75)' }}>{searchResult.user.email}</p>
                  {searchResult.cosmic_profile?.enabled_systems?.length > 0 && (
                    <p className="text-xs mt-0.5" style={{ color: '#8A72B8' }}>
                      ✦ {searchResult.cosmic_profile.enabled_systems.length} cosmic systems active
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs mb-2" style={{ color: 'rgba(82,72,104,0.7)' }}>Connection type</p>
                <div className="flex flex-wrap gap-2">
                  {CONNECTION_TYPES.map(t => (
                    <button key={t.id} onClick={() => setSelectedType(t.id)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={{
                        background: selectedType === t.id ? `${t.color}25` : 'rgba(255,255,255,0.64)',
                        border: selectedType === t.id ? `1px solid ${t.color}50` : '1px solid rgba(61,52,80,0.12)',
                        color: selectedType === t.id ? t.color : 'rgba(105,95,128,0.7)',
                      }}>
                      {t.emoji} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                placeholder="Optional note (e.g. met at yoga, childhood friend...)"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="mb-3 text-sm"
              />

              <Button onClick={handleAdd} disabled={adding} className="btn-cosmic rounded-xl w-full">
                <Plus className="w-4 h-4 mr-2" />
                {adding ? "Adding..." : "Add to Constellation"}
              </Button>
            </div>
          )}
        </div>

        {/* Connections list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#8A72B8' }} />
          </div>
        ) : connections.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-4xl mb-3">🌌</div>
            <p className="font-medium mb-1" style={{ color: 'rgba(82,72,104,0.8)', fontFamily: 'Space Grotesk, sans-serif' }}>Your constellation is empty</p>
            <p className="text-sm" style={{ color: 'rgba(122,112,144,0.6)' }}>Search for a friend's email above to add them and unlock synergy readings.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedConnections.map(group => (
              <div key={group.id}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{group.emoji}</span>
                  <h3 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif', color: group.color }}>
                    {group.label}s ({group.items.length})
                  </h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {group.items.map(conn => (
                    <ConnectionCard key={conn.id} conn={conn} onDelete={id => setConnections(prev => prev.filter(c => c.id !== id))} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}