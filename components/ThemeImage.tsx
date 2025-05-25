/* eslint-disable @next/next/no-img-element */
"use client";
import "react-medium-image-zoom/dist/styles.css";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import ImageZoom from "react-medium-image-zoom";

export function ThemeImage({
	baseName,
	alt,
	width = 3680,
	height = 2382,
}: { baseName: string; alt: string; width: number; height: number }) {
	const { theme } = useTheme();
	const [loaded, setLoaded] = useState(false);
	const [src, setSrc] = useState<string | null>(null);

	useEffect(() => {
		setLoaded(true);
	}, []);

	useEffect(() => {
		if (theme === "dark") {
			setSrc(`/images/${baseName}-dark.png`);
		} else {
			setSrc(`/images/${baseName}-light.png`);
		}
	}, [theme, baseName]);

	if (!baseName || !loaded || !src) {
		return null;
	}

	return (
		<ImageZoom>
			<img alt={alt} src={src} width={width} height={height} />
		</ImageZoom>
	);
}
