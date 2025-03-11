import { useEffect, useState, FC, type SVGProps, FunctionComponent } from "react";

const assetsWithPath = import.meta.glob("../../assets/**/*.svg", {
  query: "?react",
  import: "default",
});

const assets: Record<string, () => Promise<FC<SVGProps<SVGElement>> | undefined>> = {};
Object.keys(assetsWithPath).map((key) => {
  const name = key.replace("../../assets/", "").replace(".svg", "");
  assets[name] = assetsWithPath[key] as () => Promise<FC<SVGProps<SVGElement>> | undefined>;
});

const alreadyLoadedIcons = new Map<string, FunctionComponent<SVGProps<SVGElement>>>();

export function useDynamicSvgImport(iconPath: string) {
  const loadedIcon = alreadyLoadedIcons.get(iconPath);
  // 不直接用icon作为state，是因为react会将function的icon转为element，导致渲染报错
  const [importedIcon, setImportedIcon] = useState<{
    icon: FunctionComponent<SVGProps<SVGElement>> | undefined;
  } | null>({ icon: loadedIcon });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>();

  useEffect(() => {
    if (!loadedIcon) {
      setLoading(true);
      const importSvgIcon = async (): Promise<void> => {
        try {
          const iconImport = assets[iconPath as keyof typeof assets];
          if (iconImport) {
            const icon = await iconImport();
            setImportedIcon({ icon });
            alreadyLoadedIcons.set(iconPath, icon!);
          }
        } catch (err) {
          setError(err);
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      importSvgIcon();
    } else {
      setImportedIcon({ icon: loadedIcon });
    }
  }, [iconPath, importedIcon?.icon, loadedIcon]);

  return { error, loading, SvgIcon: importedIcon?.icon };
}
