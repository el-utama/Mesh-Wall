# Implementation audit — alpha 0.1

This implementation uses a static, modular, same-origin web application served through MeshCentral's supported custom public directory. It avoids a second Node backend, browser authentication implementation, database and video transcoding on resource-constrained STBs. MeshCentral remains authoritative for auth, permissions, consent, agent operations and screen protocol. See ADR 0002.

Implemented in source: authenticated control socket, inventory, groups, invitation request, local per-user layout, drag/reorder, individual tile sizing, focus/fullscreen, monitor picker, quality profiles, bounded opt-in view-only sessions using upstream renderer, device links and connection diagnostics. No screen data stored. No client credentials persisted. Screens stop when leaving the wall, hiding tab, losing control connection or losing inventory visibility.

Not verified: real MeshCentral handshake, desktop render, group/invite, fresh bootstrap, STB compatibility, Windows, 100 simultaneous streams. Native upstream panels remain temporary fallbacks for remote control, terminal, files, users, events and engine settings; not a full native replacement. Automatic reconnect of screen sessions intentionally not enabled before consent behavior is validated. Setup GUI, adoption, Windows installer, server maintenance and backup/restore remain incomplete.

Pinned upstream candidate: MeshCentral 1.3.2, requires Node >=22.21.1 per upstream package.json. Source inspection: https://github.com/Ylianst/MeshCentral/tree/1.3.2 and https://docs.meshcentral.com/meshcentral/customization/. No live environment is available in the development session.

Run npm run check with a compatible Node. Test on isolated tailnet with owned test PC(s). Do not use production credentials until integration and security tests pass.
