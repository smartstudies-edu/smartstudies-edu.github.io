import { useMemo, useState } from "react";
import { Film, Search, ExternalLink, Tv, AlertTriangle, FolderOpen, ListVideo } from "lucide-react";

type PanelMode = "docs" | "finder";

interface DocHub {
  id: string;
  name: string;
  url: string;
  desc: string;
}

interface ImportedLink {
  id: string;
  title: string;
  url: string;
  category: "Streaming" | "Movies" | "Shows";
}

const DEFAULT_DOC_HUBS: DocHub[] = [
  { id: "netflix-doc", name: "Netflix", url: "https://docs.google.com/presentation/d/149GpUX0v2xNpwbUTv0Ra1bXSBJ8VImN3yQXMYA9ZhKA/edit#slide=id.g2c7d3bce1ae_0_22", desc: "Doc-based Netflix launcher" },
  { id: "disney-doc", name: "Disney+", url: "https://docs.google.com/presentation/d/1cqMoS7rNvOX77938GusdWNi6mYVPOfETCVsAVW9I9ps/edit#slide=id.p", desc: "Doc-based Disney+ launcher" },
  { id: "hulu-doc", name: "Hulu", url: "https://docs.google.com/presentation/d/1YDZCGRJMcIXA6CDnnxEUcNuZuEx-NdUETeeVFulhYDg/edit#slide=id.g2ce541b7098_0_1", desc: "Doc-based Hulu launcher" },
  { id: "roku-doc", name: "Roku", url: "https://docs.google.com/presentation/d/1OjrWHYHz5xbxhVYfWbDF4J0NdM3AYHC9x2pTchv4GuU/edit#slide=id.g26f6dcac621_1_0", desc: "Doc-based Roku launcher" },
  { id: "paramount-doc", name: "Paramount+", url: "https://docs.google.com/presentation/d/1CiZMdBm677M7EIus7gT89WPxwYPzXJQgwmXGv3sLAaw/edit#slide=id.g1b71f8bdb3c_2_77", desc: "Doc-based Paramount+ launcher" },
  { id: "tubi-doc", name: "Tubi", url: "https://docs.google.com/presentation/d/1MKUZLOhfS1PyOtbz-uhfdNqewzDJIqZxBEfMeWPhJpE/edit#slide=id.g2d03a5085ad_0_68", desc: "Doc-based Tubi launcher" },
];

const IMPORTED_LINKS: ImportedLink[] = [
  { id: "stream-1", title: "Movie Web", url: "https://moovie-web.vercel.app/#/search/movie", category: "Streaming" },
  { id: "stream-2", title: "Movie Web US", url: "https://movie-web.us/#/search/movie", category: "Streaming" },
  { id: "stream-3", title: "Kaido", url: "https://kaido.to/", category: "Streaming" },
  { id: "stream-4", title: "Flixwave", url: "https://flixwave.to/", category: "Streaming" },
  { id: "stream-5", title: "1HD Movies", url: "https://1hd.sh/movies/", category: "Streaming" },
  { id: "movie-1", title: "Deadpool & Wolverine", url: "https://drive.google.com/file/d/1aBzsoTJAjhZeFFDkIV2SN7p7ZHagUEDc/view?t=375", category: "Movies" },
  { id: "movie-2", title: "Spider-Man: Into the Spider-Verse", url: "https://drive.google.com/file/d/1OTFQcdnopehlWiqkPckWxkBk6TFNvNsm/view", category: "Movies" },
  { id: "movie-3", title: "Spider-Man: Across the Spider-Verse", url: "https://drive.google.com/file/d/1dSeZ1c4_p8T_lW7z0qpKsebKYN-R3zHR/view", category: "Movies" },
  { id: "movie-4", title: "Spider-Man: No Way Home", url: "https://drive.google.com/file/d/1oddQM8w-8UqQIvB-fPpy1h-7xvAbklmA/view", category: "Movies" },
  { id: "movie-5", title: "Inside Out 2", url: "https://drive.google.com/file/d/1SABVZNMwHTME4hsFwL9IWyWZPKDTBSoT/view?t=2499", category: "Movies" },
  { id: "movie-6", title: "Interstellar", url: "https://drive.google.com/file/d/1XQprw1tRflHUZ-cNl97ODxs9U5DvYAf-/view", category: "Movies" },
  { id: "movie-7", title: "Godzilla x Kong", url: "https://drive.google.com/file/d/1h5vNxBZhabSuZdPvbGcFQN1x-xfURsfO/view", category: "Movies" },
  { id: "movie-8", title: "Wicked (2024)", url: "https://drive.google.com/file/d/14j1Jpjcw0vcyphIyx03LM-koNxSynTxS/view", category: "Movies" },
  { id: "movie-9", title: "Despicable Me 4", url: "https://drive.google.com/file/d/1cV1LhzpEU6P6-pSfcG06W4ryQnggefPE/view", category: "Movies" },
  { id: "show-1", title: "Beast Games S01E01", url: "https://drive.google.com/file/d/1lxpivzn1LzchNkBncCNEN1azfabkr7gT/view", category: "Shows" },
  { id: "show-2", title: "Squid Game S02E01", url: "https://www.dropbox.com/scl/fi/msnhwxwehfpn7wsh1i1xe/Squid-Game-S02E01-Bread-and-Lottery-Awafim.tv.mkv?rlkey=48pzzfss7yyrzmh69cr43bef4&st=12dpv69y&dl=0", category: "Shows" },
  { id: "show-3", title: "Cobra Kai S01E01", url: "https://drive.google.com/file/d/1JU4wW3axueyByNhzs6y9zSbJHAEgka45/view", category: "Shows" },
  { id: "show-4", title: "Family Guy Seasons 1-23", url: "https://drive.google.com/drive/folders/11W6C-Jqv9iQVasqjfiaYz77puax1UTjH?usp=drive_link", category: "Shows" },
];

const MOVIE_CATEGORIES = ["All", "Action", "Sci-Fi", "Drama", "Comedy", "Animation"];
const POPULAR_MOVIES = [
  { id: "1", title: "Oppenheimer", year: "2023", category: "Drama", poster: "💣" },
  { id: "2", title: "Spider-Man: Across the Spider-Verse", year: "2023", category: "Action", poster: "🕷️" },
  { id: "3", title: "The Batman", year: "2022", category: "Action", poster: "🦇" },
  { id: "4", title: "Top Gun: Maverick", year: "2022", category: "Action", poster: "✈️" },
  { id: "5", title: "Dune: Part Two", year: "2024", category: "Sci-Fi", poster: "🏜️" },
  { id: "6", title: "Interstellar", year: "2014", category: "Sci-Fi", poster: "🚀" },
  { id: "7", title: "Inside Out 2", year: "2024", category: "Animation", poster: "😊" },
  { id: "8", title: "Barbie", year: "2023", category: "Comedy", poster: "💖" },
];

const MoviesPanel = () => {
  const [mode, setMode] = useState<PanelMode>("docs");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [popupBlocked, setPopupBlocked] = useState(false);

  const openTarget = (targetUrl: string) => {
    const win = window.open(targetUrl, "_blank", "noopener,noreferrer");
    setPopupBlocked(!win);
  };

  const filtered = POPULAR_MOVIES.filter((movie) => {
    const matchesSearch = movie.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || movie.category === category;
    return matchesSearch && matchesCategory;
  });

  const filteredImportedLinks = IMPORTED_LINKS.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase()),
  );

  const openMovieDocSearch = (title: string) => {
    const query = encodeURIComponent(`site:docs.google.com ${title} watch`);
    openTarget(`https://www.google.com/search?q=${query}`);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-3">
          <Film className="w-6 h-6 text-primary" /> Movies & Shows
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Stream via Google Docs launchers or browse Drive links.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setMode("docs")} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${mode === "docs" ? "gradient-warm-bg text-primary-foreground shadow-md" : "bg-muted/60 text-muted-foreground hover:text-foreground"}`}>
          <FolderOpen className="w-4 h-4 inline mr-1.5" /> Doc Hubs
        </button>
        <button onClick={() => setMode("finder")} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${mode === "finder" ? "gradient-warm-bg text-primary-foreground shadow-md" : "bg-muted/60 text-muted-foreground hover:text-foreground"}`}>
          <Tv className="w-4 h-4 inline mr-1.5" /> Movie Finder
        </button>
      </div>

      {popupBlocked && (
        <div className="mb-4 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p>Pop-up blocked. Enable pop-ups for this site, then click again.</p>
        </div>
      )}

      {mode === "docs" && (
        <>
          {/* Search Doc Hubs */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search streaming services..." className="w-full pl-9 pr-4 py-2.5 bg-muted/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 text-sm" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {DEFAULT_DOC_HUBS.filter(h => h.name.toLowerCase().includes(search.toLowerCase()) || h.desc.toLowerCase().includes(search.toLowerCase())).map((hub) => (
              <button
                key={hub.id}
                onClick={() => openTarget(hub.url)}
                className="bg-card border border-border rounded-2xl p-4 text-left hover:border-primary/40 transition-all"
              >
                <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
                  {hub.name} <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </h3>
                <p className="text-xs text-muted-foreground">{hub.desc}</p>
              </button>
            ))}
          </div>

          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <ListVideo className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">Quick Links</h4>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {filteredImportedLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => openTarget(link.url)}
                  className="text-left p-3 rounded-lg border border-border hover:border-primary/40 bg-muted/30 hover:bg-muted/50 transition-all"
                >
                  <p className="text-xs font-semibold text-foreground line-clamp-1">{link.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{link.category}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {mode === "finder" && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search movies..." className="w-full pl-9 pr-4 py-2.5 bg-muted/50 border border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 text-sm" />
            </div>
            <div className="flex flex-wrap gap-2">
              {MOVIE_CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setCategory(cat)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${category === cat ? "gradient-warm-bg text-primary-foreground shadow-md" : "bg-muted/60 text-muted-foreground hover:text-foreground"}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filtered.map((movie) => (
              <button key={movie.id} onClick={() => openMovieDocSearch(movie.title)} className="group relative bg-card border border-border rounded-xl p-4 text-center transition-all card-hover overflow-hidden">
                <div className="text-4xl mb-3">{movie.poster}</div>
                <h3 className="text-xs font-bold text-foreground mb-0.5 line-clamp-2">{movie.title}</h3>
                <p className="text-[10px] text-muted-foreground">{movie.year}</p>
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="w-7 h-7 text-primary" />
                </div>
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Film className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No movies found.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MoviesPanel;
