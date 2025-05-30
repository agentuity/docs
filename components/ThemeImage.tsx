/* eslint-disable @next/next/no-img-element */
"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import ImageZoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

const placeholder =
	"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export function ThemeImage({
	baseName,
	alt,
	width = 3680,
	height = 2382,
}: { baseName: string; alt: string; width: number; height: number }) {
	const { theme, resolvedTheme } = useTheme();
	const [loaded, setLoaded] = useState(false);
	const [src, setSrc] = useState<string | null>(null);

	useEffect(() => {
		setLoaded(true);
	}, []);

	useEffect(() => {
		if (theme === "dark" || (theme === "system" && resolvedTheme === "dark")) {
			setSrc(`/images/${baseName}-dark.png`);
		} else {
			setSrc(`/images/${baseName}-light.png`);
		}
	}, [theme, resolvedTheme, baseName]);

	if (!baseName || !loaded || !src) {
		return <img alt={alt} src={placeholder} width={width} height={height} />;
	}

	return (
		<ImageZoom>
			<img alt={alt} src={src} width={width} height={height} />
		</ImageZoom>
	);
}
