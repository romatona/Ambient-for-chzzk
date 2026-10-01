# Upstream attribution

chizAmbi reuses and adapts Wessel Kroos's [Ambient light for YouTube](https://github.com/WesselKroos/youtube-ambilight), commit `18d17188e5562e5ee913f005192d30c9a60be078`, package version 2.38.17.

The upstream MIT copyright and permission notice is preserved in LICENSE. Its package.json said ISC, but the repository LICENSE is MIT; this derivative follows the LICENSE file.

The active extension bundles the original projector-webgl.js, projector-2d.js, projector-shadow.js and supporting generic utilities. The CHZZK controller, settings panel and build entry are adaptations. WebGL diagnostics and storage imports are replaced with local-only implementations. The 2D renderer has additional event-listener cleanup on shrink/dispose. Other copied upstream source remains reference material and is not bundled. No upstream icons or donation assets are distributed in this prototype.
