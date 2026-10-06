# Local project synchronization

Use `C:\Users\Jaynova\ksitmcareers-v1` as the working folder. Its `main` branch tracks `origin/main` at `https://github.com/ksitmcareerservicescentre-ops/ksitmcareers.git`.

The older workspace had independent Git history and no remote. Work previously pushed online was made in `C:\Users\Jaynova\repo`, so it did not update this folder automatically.

Before synchronization, the old committed history was preserved on `backup/local-before-sync` and its uncommitted files in the stash named `local-before-video-center-sync`. These are recovery copies; do not apply the stash wholesale over the synchronized project.

Run `git pull --ff-only` here to receive future online changes. Local edits become available online only after commit, push, and a successful deployment. Environment files and dependencies remain local and are not synchronized by Git.

Video Center lives at `/training/preview`, is restricted to Super Admin, and is linked from the public Services card for that role. YouTube and direct HTTPS video files share controls. Direct media must be reachable by the viewer and use a browser-supported format such as MP4 or WebM; arbitrary provider web pages are not direct video files.
