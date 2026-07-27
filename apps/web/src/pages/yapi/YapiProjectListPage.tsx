import {
  Add01Icon,
  ApiIcon,
  Folder01Icon,
  Layers01Icon,
  Logout01Icon,
  SourceCodeIcon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { useEffect, useState, type MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { YapiCreateCollectionModal } from "@/components/yapi/YapiCreateCollectionModal";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { YAPI_BASE, useYapiAuth } from "@/hooks/useYapiAuth";
import { listProjects, type YapiProject } from "@/lib/yapi-api";
import {
  addCollection,
  genCollectionId,
  loadCollections,
  loadFavProjects,
  toggleFavProject,
  type StoredCollection,
} from "@/lib/yapi-collections";
import { cn } from "@/lib/utils";

function subcatTotal(c: StoredCollection): number {
  return (c.subcats || []).reduce((n, s) => n + s.items.length, 0);
}

export function YapiProjectListPage() {
  const { user, logout } = useYapiAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<YapiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [collections, setCollections] = useState<StoredCollection[]>([]);
  const [favIds, setFavIds] = useState<Set<number>>(() => new Set(loadFavProjects()));
  const [createOpen, setCreateOpen] = useState(false);
  const [catName, setCatName] = useState("");

  const refreshCollections = () => setCollections(loadCollections());
  const favProjects = projects.filter((p) => favIds.has(p._id));
  const totalIfaces = collections.reduce((n, c) => n + subcatTotal(c), 0);

  const onToggleFav = (e: MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    setFavIds(new Set(toggleFavProject(id)));
  };

  useEffect(() => {
    refreshCollections();
    void listProjects()
      .then(setProjects)
      .catch((err) => setError(String((err as Error).message || err)))
      .finally(() => setLoading(false));
  }, []);

  const doCreate = () => {
    if (!catName.trim()) return;
    const id = genCollectionId();
    addCollection(id, catName);
    refreshCollections();
    setCreateOpen(false);
    setCatName("");
    void navigate(`${YAPI_BASE}/custom/${id}`);
  };

  return (
    <div className="bg-background flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="border-border/60 flex shrink-0 items-center justify-between border-b bg-white/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
            <Icon icon={ApiIcon} className="size-4" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-800">项目列表</h1>
            <p className="text-muted-foreground text-xs">
              {user?.username || user?.email || "已登录"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" asChild>
            <Link to={`${YAPI_BASE}/debug`}>
              <Icon icon={SourceCodeIcon} className="size-3.5" />
              接口调试
            </Link>
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
            <Icon icon={Add01Icon} className="size-3.5" />
            自定义分类
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => void logout()}>
            <Icon icon={Logout01Icon} className="size-3.5" />
            退出
          </Button>
        </div>
      </header>

      <main className="scrollbar-thin min-h-0 flex-1 overflow-y-auto bg-[#f8fafc] p-6">
        {loading && <div className="text-muted-foreground text-sm">加载项目中…</div>}
        {!loading && error && (
          <div className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm">
            {error}
          </div>
        )}
        {!loading && !error && projects.length === 0 && collections.length === 0 && (
          <div className="text-muted-foreground text-sm">当前账号暂无可访问项目。</div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Link
            to={`${YAPI_BASE}/all`}
            className="border-primary/25 bg-primary/5 hover:border-primary/40 group rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm"
          >
            <div className="bg-primary/10 text-primary mb-3 flex size-9 items-center justify-center rounded-lg">
              <Icon icon={Layers01Icon} className="size-4" />
            </div>
            <div className="font-medium text-slate-800">全部接口</div>
            <div className="text-muted-foreground mt-1 text-xs">
              {totalIfaces ? `${totalIfaces} 个收藏接口` : "尚未收藏任何接口"}
            </div>
          </Link>

          {collections.map((c) => (
            <Link
              key={c.id}
              to={`${YAPI_BASE}/custom/${c.id}`}
              className="border-border/60 hover:border-primary/30 group rounded-xl border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm"
            >
              <div className="bg-muted text-muted-foreground mb-3 flex size-9 items-center justify-center rounded-lg">
                <Icon icon={Folder01Icon} className="size-4" />
              </div>
              <div className="font-medium text-slate-800">{c.name}</div>
              <div className="text-muted-foreground mt-1 text-xs">
                {(c.subcats || []).length} 个细分分类 · {subcatTotal(c)} 个接口
              </div>
            </Link>
          ))}
        </div>

        {!loading && favProjects.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Icon icon={StarIcon} className="size-4 text-amber-500" />
              收藏项目
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {favProjects.map((p) => (
                <ProjectCard
                  key={`fav-${p._id}`}
                  project={p}
                  favIds={favIds}
                  onToggleFav={onToggleFav}
                />
              ))}
            </div>
          </section>
        )}

        {!loading && projects.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">项目</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {projects.map((p) => (
                <ProjectCard key={p._id} project={p} favIds={favIds} onToggleFav={onToggleFav} />
              ))}
            </div>
          </section>
        )}
      </main>

      <YapiCreateCollectionModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setCatName("");
        }}
        catName={catName}
        setCatName={setCatName}
        onCreate={doCreate}
      />
    </div>
  );
}

function ProjectCard({
  project: p,
  favIds,
  onToggleFav,
}: {
  project: YapiProject;
  favIds: Set<number>;
  onToggleFav: (e: MouseEvent, id: number) => void;
}) {
  const isFav = favIds.has(p._id);
  return (
    <Link
      to={`${YAPI_BASE}/projects/${p._id}`}
      className="border-border/60 hover:border-primary/30 group relative rounded-xl border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm"
    >
      <button
        type="button"
        className={cn(
          "absolute right-3 top-3 rounded-full p-1 transition-colors",
          isFav ? "text-amber-500" : "text-muted-foreground hover:text-amber-500",
        )}
        aria-label={isFav ? "取消收藏" : "收藏项目"}
        aria-pressed={isFav}
        onClick={(e) => onToggleFav(e, p._id)}
      >
        <Icon icon={StarIcon} className="size-4" />
      </button>
      <div className="pr-8 font-medium text-slate-800">{p.name}</div>
      {p.desc ? (
        <div className="text-muted-foreground mt-1 line-clamp-2 text-xs">{p.desc}</div>
      ) : null}
      {p.group_name ? (
        <div className="text-muted-foreground mt-2 text-[10px] uppercase tracking-wide">
          {p.group_name}
        </div>
      ) : null}
      {p.basepath ? (
        <code className="text-muted-foreground mt-1 block font-mono text-[10px]">{p.basepath}</code>
      ) : null}
    </Link>
  );
}
