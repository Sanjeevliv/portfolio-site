// Incremental SRE / Cisco / Systems Engineering CLI Curriculum
// Zero flag spoilers in prompts. Organized into 4 Incremental Levels per track:
// Level 1: Foundation Commands
// Level 2: Flag Composition, Filtering & Pipelines
// Level 3: Deep Diagnostics, Kernel /proc, eBPF & Symptom Triage
// Level 4: Multi-Step Production Incident Chains

window.SRE_LAB_SESSIONS = [
  { id: "all", title: "All Topics (Incremental)" },
  { id: "linux-files", title: "1. Linux Files & Text" },
  { id: "linux-proc", title: "2. Processes, Memory & /proc" },
  { id: "linux-net", title: "3. Linux Networking & Packet Capture" },
  { id: "containers", title: "4. Docker & containerd (crictl)" },
  { id: "systemd-logs", title: "5. Systemd Services & Kernel Logs" },
  { id: "kubectl", title: "6. Kubernetes (kubectl)" },
  { id: "helm-cilium", title: "7. Helm, Cilium & Hubble (eBPF)" },
  { id: "git-tf-go", title: "8. Git, Terraform, Go & PromQL" },
  { id: "cisco-incidents", title: "9. Multi-Step Incident Chains" }
];

window.SRE_LAB_QUESTIONS = [
  // ============================================================================
  // TRACK 1: LINUX FILES, TEXT & PERMISSIONS
  // ============================================================================
  {
    id: "lnx-pwd",
    session: "linux-files",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "pwd",
    title: "Print the current working directory",
    prompt: "You just opened an SSH session on a worker node. Print the full absolute path of your current working directory.",
    canonical: "pwd",
    accepted: ["pwd", "pwd -P"],
    grammar: [
      { token: "pwd", desc: "Print name of current/working directory" },
      { token: "-P", desc: "(Optional) Resolve all symlinks to the physical path" }
    ],
    sampleOutput: `/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs`,
    explanation: "Use `pwd -P` when debugging symlinked deployment directories to see the real physical path on disk."
  },
  {
    id: "lnx-ls-lah",
    session: "linux-files",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "ls",
    title: "List all files including hidden dotfiles with permissions and human-readable sizes",
    prompt: "List all entries in the current directory—including hidden dotfiles—in long listing format with human-readable file sizes (K, M, G).",
    canonical: "ls -lah",
    accepted: ["ls -lah", "ls -l -a -h"],
    grammar: [
      { token: "ls", desc: "List directory contents" },
      { token: "-l", desc: "Long format (permissions, owner, group, size, timestamp)" },
      { token: "-a", desc: "Include hidden dotfiles starting with '.'" },
      { token: "-h", desc: "Human-readable file sizes (K, M, G)" }
    ],
    sampleOutput: `drwxr-xr-x  6 sanjeev staff 192B Nov  2 18:10 .
-rw-------  1 sanjeev staff 1.4K Nov  2 17:45 .env
-rwxr-xr-x  1 sanjeev staff 8.2M Nov  2 18:09 frametap`,
    explanation: "Inspecting permissions, ownership, and hidden `.env` or `.kube` files is the first step in any unfamiliar directory."
  },
  {
    id: "lnx-ls-lth",
    session: "linux-files",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "ls",
    title: "List log files sorted by most recently modified first",
    prompt: "List the files inside `/var/log` in long format with human-readable sizes, sorted by modification timestamp so the newest files appear at the top.",
    canonical: "ls -lth /var/log",
    accepted: ["ls -lth /var/log", "ls -lt /var/log", "ls -lth /var/log/"],
    grammar: [
      { token: "ls -l", desc: "Long format" },
      { token: "-t", desc: "Sort by modification time, newest first" },
      { token: "-h", desc: "Human-readable sizes" }
    ],
    sampleOutput: `-rw-r----- 1 syslog adm 4.2M Nov  2 21:59 syslog
-rw-r----- 1 syslog adm 1.8M Nov  2 21:58 kern.log`,
    explanation: "`ls -lth` immediately shows which log file was written to most recently during an active incident."
  },
  {
    id: "lnx-head-lines",
    session: "linux-files",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "head",
    title: "Print the first 20 lines of a large log file",
    prompt: "Print only the first `20` lines of `/var/log/syslog` without loading the entire file into an editor.",
    canonical: "head -n 20 /var/log/syslog",
    accepted: ["head -n 20 /var/log/syslog", "head -20 /var/log/syslog", "head -n20 /var/log/syslog"],
    grammar: [
      { token: "head", desc: "Output the first part of files" },
      { token: "-n 20", desc: "Print the first 20 lines" }
    ],
    sampleOutput: `Nov  2 00:00:01 node-1 systemd[1]: Started Rotate log files.`,
    explanation: "Quickly previews file headers or CSV/log schemas without paging through gigabytes of text."
  },
  {
    id: "lnx-tail-f",
    session: "linux-files",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "tail",
    title: "Stream new lines appended to a log file in real time",
    prompt: "Follow `/var/log/syslog` in real time so new log lines are printed to your terminal as they are written.",
    canonical: "tail -f /var/log/syslog",
    accepted: ["tail -f /var/log/syslog", "tail -F /var/log/syslog"],
    grammar: [
      { token: "tail", desc: "Output the end of a file" },
      { token: "-f", desc: "Follow appended data as the file grows (use -F to survive log rotation)" }
    ],
    sampleOutput: `Nov  2 22:01:04 node-1 kernel: [84120.11] device veth4a1b entered promiscuous mode`,
    explanation: "Use uppercase `tail -F` when watching logs managed by `logrotate` so `tail` reopens the new file if the old one is rotated."
  },
  {
    id: "lnx-wc-lines",
    session: "linux-files",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "wc",
    title: "Count the total number of lines in a file",
    prompt: "Count only the number of newline-separated lines in `access.log`.",
    canonical: "wc -l access.log",
    accepted: ["wc -l access.log"],
    grammar: [
      { token: "wc", desc: "Print newline, word, and byte counts" },
      { token: "-l", desc: "Print only the line count" }
    ],
    sampleOutput: `482910 access.log`,
    explanation: "Often piped after `grep` or `ss` (e.g., `ss -tan | wc -l`) to measure connection or error counts."
  },
  {
    id: "lnx-chmod-755",
    session: "linux-files",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "chmod",
    title: "Set rwxr-xr-x (0755) permissions on a compiled Go binary",
    prompt: "Set octal permissions `755` (owner read/write/execute, group and others read/execute) on `./frametap`.",
    canonical: "chmod 755 ./frametap",
    accepted: ["chmod 755 ./frametap", "chmod 755 frametap", "chmod +x ./frametap", "chmod +x frametap", "chmod 0755 ./frametap"],
    grammar: [
      { token: "chmod", desc: "Change file mode bits" },
      { token: "755", desc: "Owner=7 (rwx), Group=5 (r-x), Others=5 (r-x)" }
    ],
    sampleOutput: `-rwxr-xr-x 1 sanjeev staff 8.2M Nov  2 18:09 frametap`,
    explanation: "`755` is standard for executable binaries and directories; `600` (`rw-------`) is required for private keys like `~/.ssh/id_ed25519`."
  },
  {
    id: "lnx-chown-recursive",
    session: "linux-files",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "chown",
    title: "Recursively change ownership of a data directory to user and group 'prometheus'",
    prompt: "Change the owner and group of `/var/lib/prometheus` and all files inside it recursively to `prometheus:prometheus`.",
    canonical: "chown -R prometheus:prometheus /var/lib/prometheus",
    accepted: ["chown -R prometheus:prometheus /var/lib/prometheus", "chown -R prometheus:prometheus /var/lib/prometheus/"],
    grammar: [
      { token: "chown", desc: "Change file owner and group" },
      { token: "-R", desc: "Operate on files and directories recursively" },
      { token: "prometheus:prometheus", desc: "<user>:<group>" }
    ],
    sampleOutput: `(Ownership of /var/lib/prometheus tree updated to prometheus:prometheus)`,
    explanation: "Container volumes mounted from the host frequently fail with `Permission denied` when the container runs as a non-root UID and the host directory is owned by `root:root`."
  },
  {
    id: "lnx-ln-symlink",
    session: "linux-files",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "ln",
    title: "Create a symbolic link pointing to an nginx site configuration",
    prompt: "Create a symbolic (soft) link at `/etc/nginx/sites-enabled/app.conf` that points to `/etc/nginx/sites-available/app.conf`.",
    canonical: "ln -s /etc/nginx/sites-available/app.conf /etc/nginx/sites-enabled/app.conf",
    accepted: ["ln -s /etc/nginx/sites-available/app.conf /etc/nginx/sites-enabled/app.conf"],
    grammar: [
      { token: "ln -s", desc: "Create a symbolic link instead of a hard link" },
      { token: "<target> <link_name>", desc: "Source path first, destination symlink path second" }
    ],
    sampleOutput: `lrwxrwxrwx 1 root root 36 Nov  2 22:10 /etc/nginx/sites-enabled/app.conf -> /etc/nginx/sites-available/app.conf`,
    explanation: "Remember the argument order of `ln -s <target> <link>` matches `cp <source> <dest>`."
  },
  {
    id: "lnx-tar-extract",
    session: "linux-files",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "tar",
    title: "Extract a gzip-compressed .tar.gz archive verbosely",
    prompt: "Extract the gzip-compressed archive `cilium-linux-amd64.tar.gz` in the current directory with verbose output.",
    canonical: "tar -xzvf cilium-linux-amd64.tar.gz",
    accepted: [
      "tar -xzvf cilium-linux-amd64.tar.gz",
      "tar -xvzf cilium-linux-amd64.tar.gz",
      "tar -xzf cilium-linux-amd64.tar.gz",
      "tar xzvf cilium-linux-amd64.tar.gz"
    ],
    grammar: [
      { token: "-x", desc: "Extract archive" },
      { token: "-z", desc: "Decompress with gzip" },
      { token: "-v", desc: "Verbose file list" },
      { token: "-f", desc: "Archive filename follows immediately" }
    ],
    sampleOutput: `cilium`,
    explanation: "To create a `.tar.gz` archive instead, replace `-x` with `-c`: `tar -czvf archive.tar.gz <dir>`."
  },
  {
    id: "lnx-find-logs",
    session: "linux-files",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "find",
    title: "Find all regular files ending in .log inside /var/log",
    prompt: "Search recursively inside `/var/log` for regular files (excluding directories and symlinks) whose filename ends with `.log`.",
    canonical: "find /var/log -type f -name \"*.log\"",
    accepted: [
      "find /var/log -type f -name \"*.log\"",
      "find /var/log -name \"*.log\" -type f",
      "find /var/log -name *.log"
    ],
    grammar: [
      { token: "find /var/log", desc: "Starting directory" },
      { token: "-type f", desc: "Match regular files only" },
      { token: "-name \"*.log\"", desc: "Match filenames ending with .log" }
    ],
    sampleOutput: `/var/log/kern.log
/var/log/nginx/error.log`,
    explanation: "Always quote glob patterns (`\"*.log\"`) so your shell does not expand `*` before invoking `find`."
  },
  {
    id: "lnx-find-large",
    session: "linux-files",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "find",
    title: "Find regular files strictly larger than 100 Megabytes under /var",
    prompt: "A Kubernetes node triggered a `DiskPressure` alert. Search `/var` recursively for regular files strictly larger than `100M`.",
    canonical: "find /var -type f -size +100M",
    accepted: [
      "find /var -type f -size +100M",
      "find /var -size +100M -type f",
      "find /var -size +100M"
    ],
    grammar: [
      { token: "-type f", desc: "Regular files only" },
      { token: "-size +100M", desc: "Files strictly greater than 100 Megabytes" }
    ],
    sampleOutput: `/var/log/journal/a8b1c3/system.journal
/var/lib/docker/containers/9f8e1a/9f8e1a-json.log`,
    explanation: "Unrotated container JSON logs or systemd journals under `/var` are the #1 cause of node `DiskPressure`."
  },
  {
    id: "lnx-find-mtime",
    session: "linux-files",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "find",
    title: "Find configuration files in /etc modified within the last 24 hours",
    prompt: "A server started misbehaving today after an undocumented config change. Find all regular files under `/etc` modified less than `1` day ago.",
    canonical: "find /etc -type f -mtime -1",
    accepted: ["find /etc -type f -mtime -1", "find /etc -mtime -1 -type f", "find /etc -mtime -1"],
    grammar: [
      { token: "find /etc -type f", desc: "Search regular files in /etc" },
      { token: "-mtime -1", desc: "Modified within the last 24 hours (use -mmin -60 for last 60 minutes)" }
    ],
    sampleOutput: `/etc/sysctl.d/99-kubernetes-cri.conf
/etc/cni/net.d/05-cilium.conflist`,
    explanation: "When someone edits a host config file manually and doesn't document it, `find /etc -type f -mtime -1` catches the exact file."
  },
  {
    id: "lnx-grep-error",
    session: "linux-files",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "grep",
    title: "Search recursively and case-insensitively for 'error' with line numbers",
    prompt: "Search all files inside `/var/log/nginx` and its subdirectories for the word `error` (ignoring case) and prefix each matching line with its line number.",
    canonical: "grep -rin \"error\" /var/log/nginx",
    accepted: ["grep -rin \"error\" /var/log/nginx", "grep -rin error /var/log/nginx"],
    grammar: [
      { token: "-r", desc: "Search directories recursively" },
      { token: "-i", desc: "Case-insensitive matching (error, ERROR, Error)" },
      { token: "-n", desc: "Include 1-based line numbers" }
    ],
    sampleOutput: `/var/log/nginx/error.log:42:2026/11/02 [error] connect() failed (111: Connection refused)`,
    explanation: "`grep -rin` is essential muscle memory for searching codebases and `/var/log` trees."
  },
  {
    id: "lnx-grep-invert",
    session: "linux-files",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "grep",
    title: "Strip commented and empty lines from a config file",
    prompt: "Print all lines in `/etc/ssh/sshd_config` that do NOT match the extended regular expression `'^(#|$)'` (i.e. exclude comment lines and blank lines).",
    canonical: "grep -Ev '^(#|$)' /etc/ssh/sshd_config",
    accepted: [
      "grep -Ev '^(#|$)' /etc/ssh/sshd_config",
      "grep -vE '^(#|$)' /etc/ssh/sshd_config",
      "grep -v '^#' /etc/ssh/sshd_config"
    ],
    grammar: [
      { token: "-E", desc: "Extended regular expression syntax" },
      { token: "-v", desc: "Invert match (print lines that do NOT match)" },
      { token: "'^(#|$)'", desc: "Lines starting with '#' or empty lines" }
    ],
    sampleOutput: `Port 22
PermitRootLogin no
PubkeyAuthentication yes`,
    explanation: "Instantly distills a 500-line default config file down to the active non-comment directives."
  },
  {
    id: "lnx-grep-context",
    session: "linux-files",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "grep",
    title: "Print 3 lines of context before and after every 'panic:' in app.log",
    prompt: "Search `app.log` for `panic:` and include `3` lines of surrounding context both before and after each match.",
    canonical: "grep -C 3 \"panic:\" app.log",
    accepted: [
      "grep -C 3 \"panic:\" app.log",
      "grep -C 3 panic: app.log",
      "grep -C3 panic: app.log",
      "grep -C3 \"panic:\" app.log"
    ],
    grammar: [
      { token: "-C 3", desc: "Print 3 lines of leading and trailing context (use -B 3 for before, -A 3 for after)" }
    ],
    sampleOutput: `2026-11-02T18:10:01Z INFO decoding packet len=64
panic: runtime error: slice bounds out of range [:42] with length 14
goroutine 18 [running]:`,
    explanation: "Single-line grep matches often miss stack traces; `-A 10` (after) or `-C 3` (around) captures the surrounding crash context."
  },
  {
    id: "lnx-sed-replace",
    session: "linux-files",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "sed",
    title: "Replace all occurrences of an IP address in-place across a file",
    prompt: "Modify `config.yaml` in-place by substituting every occurrence of `localhost` with `10.96.0.1` on every line.",
    canonical: "sed -i 's/localhost/10.96.0.1/g' config.yaml",
    accepted: ["sed -i 's/localhost/10.96.0.1/g' config.yaml"],
    grammar: [
      { token: "sed -i", desc: "Edit file in-place" },
      { token: "'s/localhost/10.96.0.1/g'", desc: "Substitute (s) all matches globally (g) on each line" }
    ],
    sampleOutput: `(config.yaml updated in-place)`,
    explanation: "Without the trailing `g` modifier, `sed` only replaces the first occurrence on each line."
  },
  {
    id: "lnx-awk-columns",
    session: "linux-files",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "awk",
    title: "Extract the 1st and 9th whitespace-delimited columns from access.log",
    prompt: "Print the 1st column (client IP) and 9th column (HTTP status code) from `access.log` using `awk`.",
    canonical: "awk '{print $1, $9}' access.log",
    accepted: ["awk '{print $1, $9}' access.log", "awk '{ print $1, $9 }' access.log"],
    grammar: [
      { token: "awk", desc: "Pattern scanning and text processing language" },
      { token: "'{print $1, $9}'", desc: "Output field 1 and field 9 separated by a space" }
    ],
    sampleOutput: `10.244.1.18 502
172.16.0.5 200`,
    explanation: "`awk` splits on any run of whitespace automatically, making it ideal for log parsing."
  },
  {
    id: "lnx-awk-filter-500",
    session: "linux-files",
    level: 3,
    difficulty: "Level 3 · Deep Diagnostics",
    tool: "awk",
    title: "Print client IPs only for lines where HTTP status (column 9) equals 500",
    prompt: "In `access.log`, column 1 is the client IP and column 9 is the HTTP status code. Use `awk` to print `$1` ONLY on lines where `$9 == 500`.",
    canonical: "awk '$9 == 500 {print $1}' access.log",
    accepted: [
      "awk '$9 == 500 {print $1}' access.log",
      "awk '$9 == \"500\" {print $1}' access.log",
      "awk '$9==500 {print $1}' access.log"
    ],
    grammar: [
      { token: "'$9 == 500 {print $1}'", desc: "Condition ($9 == 500) before the action block ({print $1})" }
    ],
    sampleOutput: `10.244.1.18
10.244.1.18
192.168.4.21`,
    explanation: "Using `awk` pattern-action blocks avoids unnecessary `grep | awk` pipes and prevents false matches when `500` appears in byte sizes or URLs."
  },
  {
    id: "lnx-cut-passwd",
    session: "linux-files",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "cut",
    title: "Extract usernames and login shells from colon-delimited /etc/passwd",
    prompt: "Extract field `1` (username) and field `7` (login shell) from the colon-delimited file `/etc/passwd`.",
    canonical: "cut -d: -f1,7 /etc/passwd",
    accepted: ["cut -d: -f1,7 /etc/passwd", "cut -d ':' -f 1,7 /etc/passwd", "cut -f1,7 -d: /etc/passwd"],
    grammar: [
      { token: "-d:", desc: "Use ':' as the field delimiter" },
      { token: "-f1,7", desc: "Select fields 1 and 7" }
    ],
    sampleOutput: `root:/bin/bash
sshd:/usr/sbin/nologin`,
    explanation: "`cut` is purpose-built for fixed single-character delimiters like `:` or `,`."
  },
  {
    id: "lnx-sort-uniq-pipeline",
    session: "linux-files",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "sort / uniq",
    title: "Count and rank unique IP addresses from highest frequency to lowest",
    prompt: "Given `ips.txt` (one IP per line), build a pipeline using `sort` and `uniq` that counts how many times each unique IP appears and sorts the counts in descending numeric order.",
    canonical: "sort ips.txt | uniq -c | sort -nr",
    accepted: [
      "sort ips.txt | uniq -c | sort -nr",
      "cat ips.txt | sort | uniq -c | sort -nr"
    ],
    grammar: [
      { token: "sort ips.txt", desc: "Sort lines so identical IPs are adjacent" },
      { token: "uniq -c", desc: "Collapse adjacent duplicates and prefix each with its occurrence count" },
      { token: "sort -nr", desc: "Sort numerically (-n) in reverse/descending order (-r)" }
    ],
    sampleOutput: `   1482 10.244.2.91
    319 10.244.1.14`,
    explanation: "`uniq` only compares adjacent lines, so sorting first is mandatory."
  },
  {
    id: "lnx-xargs-rm",
    session: "linux-files",
    level: 3,
    difficulty: "Level 3 · Deep Diagnostics",
    tool: "xargs",
    title: "Delete hundreds of thousands of .tmp files safely using NUL delimiters",
    prompt: "`rm /tmp/*.tmp` failed with `Argument list too long`. Pipe `find /tmp -name \"*.tmp\"` using NUL-byte delimiters into `xargs` to run `rm -f` safely.",
    canonical: "find /tmp -name \"*.tmp\" -print0 | xargs -0 rm -f",
    accepted: [
      "find /tmp -name \"*.tmp\" -print0 | xargs -0 rm -f",
      "find /tmp -type f -name \"*.tmp\" -print0 | xargs -0 rm -f"
    ],
    grammar: [
      { token: "-print0", desc: "Separate found paths with NUL (\\0) bytes instead of newlines" },
      { token: "xargs -0 rm -f", desc: "Read NUL-delimited input and invoke rm -f in safe argument batches" }
    ],
    sampleOutput: `(Deletes all .tmp files in batches without hitting kernel E2BIG limits)`,
    explanation: "`-print0 | xargs -0` handles both millions of files and filenames containing spaces or newlines safely."
  },

  // ============================================================================
  // TRACK 2: LINUX PROCESSES, MEMORY, CPU & /proc INTERNALS
  // ============================================================================
  {
    id: "proc-ps-aux",
    session: "linux-proc",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "ps",
    title: "List all running processes across all users with CPU and memory columns",
    prompt: "Display a snapshot of every running process on the system across all users in BSD user-oriented format (showing PID, %CPU, %MEM, RSS, STAT, and command).",
    canonical: "ps aux",
    accepted: ["ps aux", "ps -ef"],
    grammar: [
      { token: "ps", desc: "Process status snapshot" },
      { token: "aux", desc: "All users (a), user-oriented columns (u), include processes without a controlling tty (x)" }
    ],
    sampleOutput: `USER   PID %CPU %MEM    VSZ   RSS TTY   STAT START TIME COMMAND
root  1184  3.4  2.8 184210 11520 ?     Ssl  Oct29 84:12 /usr/bin/containerd`,
    explanation: "Check the `STAT` column: `R` = running, `S` = interruptible sleep, `D` = uninterruptible kernel I/O sleep, `Z` = zombie."
  },
  {
    id: "proc-top",
    session: "linux-proc",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "top",
    title: "Launch the standard real-time interactive CPU and memory monitor",
    prompt: "Start the standard interactive terminal process monitor to inspect real-time CPU states (`us`, `sy`, `wa`, `si`) and memory usage.",
    canonical: "top",
    accepted: ["top", "htop"],
    grammar: [
      { token: "top", desc: "Interactive real-time system and process monitor" }
    ],
    sampleOutput: `%Cpu(s): 14.2 us,  8.5 sy,  0.0 ni, 74.1 id,  0.2 wa,  0.0 hi,  3.0 si`,
    explanation: "High `wa` means disk I/O wait bottleneck; high `si` means heavy software interrupt processing (such as network packet RX)."
  },
  {
    id: "proc-free-h",
    session: "linux-proc",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "free",
    title: "Check system RAM, page cache, and available memory in human-readable units",
    prompt: "Display total, used, free, buff/cache, and available system memory scaled to human-readable units (MiB/GiB).",
    canonical: "free -h",
    accepted: ["free -h", "free -m"],
    grammar: [
      { token: "free", desc: "Display free and used memory" },
      { token: "-h", desc: "Human-readable units (Gi/Mi)" }
    ],
    sampleOutput: `               total   used   free  shared  buff/cache  available
Mem:            15Gi  4.2Gi  400Mi   124Mi        10Gi       10Gi`,
    explanation: "Focus on the `available` column—Linux uses spare RAM for disk `buff/cache` and reclaims it automatically when applications allocate memory."
  },
  {
    id: "proc-df-h",
    session: "linux-proc",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "df",
    title: "Check mounted filesystem disk space usage in human-readable units",
    prompt: "Report disk space usage across all mounted filesystems in human-readable units (G, M, K).",
    canonical: "df -h",
    accepted: ["df -h", "df -Th"],
    grammar: [
      { token: "df", desc: "Report filesystem disk space usage" },
      { token: "-h", desc: "Human-readable sizes" }
    ],
    sampleOutput: `Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p1   50G   44G  6.0G  88% /`,
    explanation: "Use `df -Th` if you also want to see the filesystem type (`ext4`, `xfs`, `overlay`, `tmpfs`)."
  },
  {
    id: "proc-du-sh",
    session: "linux-proc",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "du",
    title: "Calculate total summary disk space used by /var/log",
    prompt: "Display a single human-readable summary total of the disk space used by `/var/log` (without listing every subdirectory).",
    canonical: "du -sh /var/log",
    accepted: ["du -sh /var/log", "du -sh /var/log/"],
    grammar: [
      { token: "du", desc: "Estimate file space usage by walking directory trees" },
      { token: "-s", desc: "Display only a total summary for each argument" },
      { token: "-h", desc: "Human-readable units" }
    ],
    sampleOutput: `4.8G	/var/log`,
    explanation: "Unlike `df` (which reads filesystem superblocks instantaneously), `du` traverses the directory tree and sums visible file sizes."
  },
  {
    id: "proc-uptime",
    session: "linux-proc",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "uptime",
    title: "Check how long the host has been up and its 1/5/15-minute load averages",
    prompt: "Print the system uptime and the 1, 5, and 15-minute load averages.",
    canonical: "uptime",
    accepted: ["uptime", "uptime -p"],
    grammar: [
      { token: "uptime", desc: "Display system uptime, logged-in users, and load averages" }
    ],
    sampleOutput: ` 18:20:15 up 42 days,  9:11,  2 users,  load average: 0.48, 0.62, 0.55`,
    explanation: "Compare load averages against the number of CPU cores (`nproc` or `lscpu`)."
  },
  {
    id: "proc-kill-9",
    session: "linux-proc",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "kill",
    title: "Forcefully terminate an unresponsive process (PID 4821) with SIGKILL",
    prompt: "Process `4821` is stuck and ignored a graceful `SIGTERM`. Send `SIGKILL` (signal 9) to terminate PID `4821` immediately.",
    canonical: "kill -9 4821",
    accepted: ["kill -9 4821", "kill -KILL 4821", "kill -SIGKILL 4821"],
    grammar: [
      { token: "kill -9 4821", desc: "Send SIGKILL (signal 9) to PID 4821" }
    ],
    sampleOutput: `(PID 4821 terminated by kernel; exit code 137)`,
    explanation: "`SIGTERM` (15) lets a process flush state and close connections cleanly; `SIGKILL` (9) terminates the process immediately inside the kernel."
  },
  {
    id: "proc-ps-sort-mem",
    session: "linux-proc",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "ps",
    title: "List all processes sorted by highest memory usage first",
    prompt: "Run `ps aux` sorted in descending order of memory consumption (`--sort=-%mem`).",
    canonical: "ps aux --sort=-%mem",
    accepted: ["ps aux --sort=-%mem", "ps aux --sort=-rss"],
    grammar: [
      { token: "ps aux", desc: "List all processes" },
      { token: "--sort=-%mem", desc: "Sort descending (-) by memory percentage" }
    ],
    sampleOutput: `USER   PID %CPU %MEM     VSZ    RSS TTY  STAT START TIME COMMAND
root  4912 42.1 68.4 9841200 541200 ?    Sl   19:02 12:11 /usr/local/bin/prometheus`,
    explanation: "Use `--sort=-%cpu` to sort by highest CPU usage instead."
  },
  {
    id: "proc-lsof-port",
    session: "linux-proc",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "lsof",
    title: "Find which process has network port 8080 open using lsof",
    prompt: "Your service failed to start with `bind: address already in use` on port `8080`. Use `lsof` to find which process holds open network port `8080`.",
    canonical: "lsof -i :8080",
    accepted: ["lsof -i :8080", "lsof -i:8080", "lsof -nP -i :8080"],
    grammar: [
      { token: "lsof", desc: "List open file descriptors" },
      { token: "-i :8080", desc: "Filter for internet sockets on port 8080" }
    ],
    sampleOutput: `COMMAND  PID    USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
envoy   3109 sanjeev    9u  IPv4  41892      0t0  TCP *:8080 (LISTEN)`,
    explanation: "In UNIX, network sockets are file descriptors (`FD 9u`)."
  },
  {
    id: "proc-df-inodes",
    session: "linux-proc",
    level: 3,
    difficulty: "Level 3 · Deep Diagnostics",
    tool: "df",
    title: "Diagnose 'No space left on device' when gigabytes of disk space are still free",
    symptomOutput: `$ touch /var/spool/job.lock
touch: cannot touch '/var/spool/job.lock': No space left on device
$ df -h /
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p1   50G   12G   38G  24% /`,
    prompt: "Look at the symptom output above: `/` has 38GB free, yet creating a file fails with `No space left on device`! Run `df` to check **inode** usage across mounted filesystems.",
    canonical: "df -i",
    accepted: ["df -i", "df -i /", "df -ih"],
    grammar: [
      { token: "df -i", desc: "Display inode total/used/free counts instead of block storage" }
    ],
    sampleOutput: `Filesystem      Inodes   IUsed  IFree IUse% Mounted on
/dev/nvme0n1p1 3276800 3276800      0  100% /`,
    explanation: "Millions of tiny files can exhaust 100% of filesystem inodes (`IUse% 100%`) while plenty of block storage remains."
  },
  {
    id: "proc-lsof-deleted",
    session: "linux-proc",
    level: 3,
    difficulty: "Level 3 · Deep Diagnostics",
    tool: "lsof",
    title: "Locate processes holding open deleted files (phantom disk space leak)",
    symptomOutput: `$ df -h /var/log
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p2   40G   39G  1.0G  98% /var/log
$ du -sh /var/log
1.2G	/var/log`,
    prompt: "You deleted a 38GB log file under `/var/log`, yet `df -h` still shows 39GB used while `du -sh` shows only 1.2GB! Use `lsof` to list open files whose hard link count is less than 1 (unlinked/deleted files).",
    canonical: "lsof +L1",
    accepted: ["lsof +L1", "lsof | grep deleted"],
    grammar: [
      { token: "lsof +L1", desc: "List open files with link count < 1 (deleted from directory tree but still held open by a PID)" }
    ],
    sampleOutput: `COMMAND  PID USER   FD   TYPE DEVICE    SIZE/OFF NLINK   NODE NAME
java    2048 root    4w   REG  259,2 39812254720     0 131074 /var/log/app.log (deleted)`,
    explanation: "The kernel cannot free an unlinked file's disk blocks until the process holding its file descriptor closes it (or restarts)."
  },
  {
    id: "proc-fd-procfs",
    session: "linux-proc",
    level: 3,
    difficulty: "Level 3 · Deep Diagnostics",
    tool: "ls / proc",
    title: "Inspect open file descriptors of PID 4102 directly via /proc",
    prompt: "A minimal container has no `lsof` binary installed, and process `4102` is leaking sockets (`too many open files`). List the symlinks in `/proc` that represent all open file descriptors of PID `4102` using `ls -l`.",
    canonical: "ls -l /proc/4102/fd",
    accepted: ["ls -l /proc/4102/fd", "ls -lah /proc/4102/fd", "ls -la /proc/4102/fd", "ls -l /proc/4102/fd/"],
    grammar: [
      { token: "/proc/4102/fd", desc: "Kernel procfs directory containing one symlink per open file descriptor of PID 4102" }
    ],
    sampleOutput: `lrwx------ 1 root root 64 Nov  2 18:46 0 -> /dev/null
lrwx------ 1 root root 64 Nov  2 18:46 7 -> socket:[88412]`,
    explanation: "You can also check `/proc/4102/limits` to see the process's `Max open files` soft and hard limits, and `/proc/4102/status` to check its Linux capabilities (`CapEff`)."
  },
  {
    id: "proc-strace-pid",
    session: "linux-proc",
    level: 3,
    difficulty: "Level 3 · Deep Diagnostics",
    tool: "strace",
    title: "Attach strace to a running process to inspect live system calls",
    prompt: "Process `4102` is hung. Attach `strace` to running PID `4102` to see which system call it is blocked on.",
    canonical: "strace -p 4102",
    accepted: ["strace -p 4102", "strace -fp 4102", "strace -f -p 4102"],
    grammar: [
      { token: "strace -p 4102", desc: "Attach system-call tracer to running PID 4102 (add -f to trace child threads)" }
    ],
    sampleOutput: `strace: Process 4102 attached
futex(0xc000058148, FUTEX_WAIT_PRIVATE, 0, NULL`,
    explanation: "Use `strace -cp 4102` for a summary histogram of time spent in each syscall."
  },
  {
    id: "proc-sysctl-forward",
    session: "linux-proc",
    level: 3,
    difficulty: "Level 3 · Deep Diagnostics",
    tool: "sysctl",
    title: "Enable IPv4 packet forwarding in the Linux kernel at runtime",
    prompt: "Use `sysctl` to write `net.ipv4.ip_forward=1` at runtime so the Linux host can forward packets between interfaces.",
    canonical: "sysctl -w net.ipv4.ip_forward=1",
    accepted: ["sysctl -w net.ipv4.ip_forward=1", "sysctl net.ipv4.ip_forward=1"],
    grammar: [
      { token: "sysctl -w", desc: "Modify a kernel sysctl parameter (/proc/sys/net/ipv4/ip_forward) at runtime" }
    ],
    sampleOutput: `net.ipv4.ip_forward = 1`,
    explanation: "Mandatory on Kubernetes nodes and Linux routers; without it, packets arriving on one interface destined for another subnet are dropped."
  },

  // ============================================================================
  // TRACK 3: LINUX NETWORKING & PACKET CAPTURE (CISCO / eBPF / AF_PACKET)
  // ============================================================================
  {
    id: "net-ip-addr",
    session: "linux-net",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "ip",
    title: "Inspect IPv4 and IPv6 addresses assigned to all network interfaces",
    prompt: "Use the modern `iproute2` tool to display all Layer 3 IP addresses and CIDR masks on all network interfaces.",
    canonical: "ip addr",
    accepted: ["ip addr", "ip a", "ip address", "ip addr show", "ip -br addr"],
    grammar: [
      { token: "ip addr", desc: "Display Layer 3 IPv4/IPv6 addresses on all interfaces" }
    ],
    sampleOutput: `2: eth0@if14: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 state UP
    inet 172.17.0.2/16 brd 172.17.255.255 scope global eth0`,
    explanation: "In `eth0@if14`, `@if14` identifies the peer veth interface index in another network namespace."
  },
  {
    id: "net-ip-link",
    session: "linux-net",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "ip",
    title: "Inspect Layer 2 interface state, MAC addresses, and MTU",
    prompt: "Display all Layer 2 network interfaces, their operational link state, MAC addresses, and MTU.",
    canonical: "ip link",
    accepted: ["ip link", "ip l", "ip link show", "ip -br link"],
    grammar: [
      { token: "ip link", desc: "Inspect Layer 2 data-link parameters (MAC, MTU, UP/LOWER_UP, PROMISC)" }
    ],
    sampleOutput: `2: eth0: <BROADCAST,MULTICAST,PROMISC,UP,LOWER_UP> mtu 1500 state UP
    link/ether 52:54:00:6b:3c:11 brd ff:ff:ff:ff:ff:ff`,
    explanation: "`LOWER_UP` confirms physical Layer 1 carrier detection; `UP` confirms the interface is administratively enabled."
  },
  {
    id: "net-ip-route",
    session: "linux-net",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "ip",
    title: "Inspect the kernel Layer 3 IP routing table",
    prompt: "Display the main kernel IPv4 routing table to see the default gateway and subnet routes.",
    canonical: "ip route",
    accepted: ["ip route", "ip r", "ip route show"],
    grammar: [
      { token: "ip route", desc: "Show kernel Layer 3 routing table entries" }
    ],
    sampleOutput: `default via 10.0.2.2 dev eth0 proto dhcp src 10.0.2.15 metric 100
10.244.0.0/24 via 10.244.0.0 dev cilium_host src 10.244.0.214 mtu 1500`,
    explanation: "Shows how traffic is routed to local subnets, pod CIDRs, and the default gateway."
  },
  {
    id: "net-ip-neigh",
    session: "linux-net",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "ip",
    title: "Inspect the Layer 2 ARP / neighbor cache",
    prompt: "Display the kernel neighbor table mapping local subnet IP addresses to MAC addresses and reachability states (`REACHABLE`, `STALE`, `FAILED`).",
    canonical: "ip neigh",
    accepted: ["ip neigh", "ip n", "ip neighbor", "ip neigh show"],
    grammar: [
      { token: "ip neigh", desc: "Show ARP (IPv4) and NDISC (IPv6) neighbor cache entries" }
    ],
    sampleOutput: `10.0.2.2 dev eth0 lladdr 52:55:0a:00:02:02 REACHABLE
10.0.2.99 dev eth0 FAILED`,
    explanation: "An `INCOMPLETE` or `FAILED` entry means ARP broadcast requests (`Who has ...?`) are not receiving ARP replies at Layer 2."
  },
  {
    id: "net-ss-tulpn",
    session: "linux-net",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "ss",
    title: "List all listening TCP and UDP sockets with numeric ports and owning processes",
    prompt: "Inspect all listening TCP and UDP sockets on the host, showing numeric IP/port values and the process/PID bound to each socket.",
    canonical: "ss -tulpn",
    accepted: ["ss -tulpn"],
    grammar: [
      { token: "ss", desc: "Socket statistics utility (queries kernel netlink sock_diag)" },
      { token: "-t / -u", desc: "TCP and UDP sockets" },
      { token: "-l", desc: "Listening sockets only" },
      { token: "-p", desc: "Show process name and PID" },
      { token: "-n", desc: "Numeric addresses and port numbers (skip DNS/service resolution)" }
    ],
    sampleOutput: `Netid State  Recv-Q Send-Q Local Address:Port  Peer Address:Port Process
tcp   LISTEN 0      4096   0.0.0.0:8080        0.0.0.0:*         users:(("api",pid=4102,fd=7))`,
    explanation: "Check `Local Address:Port` (`127.0.0.1` vs `0.0.0.0`) and `Recv-Q` (current queued unaccepted connections) vs `Send-Q` (max listen backlog)."
  },
  {
    id: "net-ping-count",
    session: "linux-net",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "ping",
    title: "Send exactly 4 ICMP Echo Requests to 1.1.1.1",
    prompt: "Send `4` ICMP Echo Request packets to `1.1.1.1` and stop automatically.",
    canonical: "ping -c 4 1.1.1.1",
    accepted: ["ping -c 4 1.1.1.1", "ping 1.1.1.1 -c 4", "ping -c4 1.1.1.1"],
    grammar: [
      { token: "ping -c 4 1.1.1.1", desc: "Send 4 ICMP Echo probes to 1.1.1.1 and exit" }
    ],
    sampleOutput: `4 packets transmitted, 4 received, 0% packet loss, time 3005ms`,
    explanation: "Unlike Windows, Linux `ping` runs until interrupted unless `-c <count>` is passed."
  },
  {
    id: "net-curl-v",
    session: "linux-net",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "curl",
    title: "Inspect full HTTP headers and TLS handshake details with curl",
    prompt: "Make a verbose HTTP request to `https://sanjeevsethi.in` that prints the TCP connection, TLS handshake, outbound request headers, and inbound response headers.",
    canonical: "curl -v https://sanjeevsethi.in",
    accepted: ["curl -v https://sanjeevsethi.in", "curl -v https://sanjeevsethi.in/"],
    grammar: [
      { token: "curl -v", desc: "Verbose mode showing connection lifecycle (*), request (>), and response (<)" }
    ],
    sampleOutput: `* Connected to sanjeevsethi.in (185.199.108.153) port 443
> GET / HTTP/2
< HTTP/2 200`,
    explanation: "Use `curl -I <url>` when you only want response headers (`HEAD` request)."
  },
  {
    id: "net-dig-dns",
    session: "linux-net",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "dig",
    title: "Query DNS A records for kubernetes.default.svc.cluster.local",
    prompt: "Use `dig` to query the DNS record for `kubernetes.default.svc.cluster.local`.",
    canonical: "dig kubernetes.default.svc.cluster.local",
    accepted: [
      "dig kubernetes.default.svc.cluster.local",
      "dig +short kubernetes.default.svc.cluster.local"
    ],
    grammar: [
      { token: "dig <fqdn>", desc: "Perform DNS lookup and print QUESTION, ANSWER, and SERVER sections" }
    ],
    sampleOutput: `kubernetes.default.svc.cluster.local. 5 IN A 10.96.0.1`,
    explanation: "Pass `@<dns-server-ip>` (e.g. `dig @10.96.0.10 ...`) to test a specific DNS server directly."
  },
  {
    id: "net-nc-portcheck",
    session: "linux-net",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "nc",
    title: "Test TCP port 443 reachability on 10.96.0.1 using netcat",
    prompt: "Use `nc` (netcat) in zero-I/O port-scanning mode with verbose output to verify if TCP port `443` is open on `10.96.0.1`.",
    canonical: "nc -zv 10.96.0.1 443",
    accepted: ["nc -zv 10.96.0.1 443", "nc -vz 10.96.0.1 443"],
    grammar: [
      { token: "-z", desc: "Zero-I/O mode (complete 3-way TCP handshake and close immediately)" },
      { token: "-v", desc: "Verbose connection status output" }
    ],
    sampleOutput: `Connection to 10.96.0.1 443 port [tcp/https] succeeded!`,
    explanation: "Cleanest way to verify L4 TCP reachability when `curl` isn't applicable (e.g. databases, gRPC, or custom protocols)."
  },
  {
    id: "net-traceroute",
    session: "linux-net",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "traceroute",
    title: "Trace Layer 3 router hops to 8.8.8.8 without reverse DNS lookups",
    prompt: "Trace the network path hop-by-hop to `8.8.8.8` with numeric IP output only (skipping reverse DNS hostname resolution).",
    canonical: "traceroute -n 8.8.8.8",
    accepted: ["traceroute -n 8.8.8.8", "traceroute 8.8.8.8"],
    grammar: [
      { token: "traceroute -n", desc: "Send incrementing TTL probes without reverse DNS lookups" }
    ],
    sampleOutput: ` 1  10.0.2.2  0.412 ms
 2  172.16.0.1  2.104 ms`,
    explanation: "Skipping reverse DNS (`-n`) prevents 5-second timeouts on hops without PTR records."
  },
  {
    id: "net-ip-s-link",
    session: "linux-net",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "ip",
    title: "Inspect RX/TX packet drop and error counters on network interfaces",
    prompt: "Display Layer 2 interface details along with per-interface RX/TX packet, byte, error, and drop statistics using `ip`.",
    canonical: "ip -s link",
    accepted: ["ip -s link", "ip -s l", "ip -s link show", "ip -s link show eth0"],
    grammar: [
      { token: "ip -s link", desc: "Include RX and TX packet/error/drop counters for each interface" }
    ],
    sampleOutput: `RX:  bytes  packets errors dropped  missed   mcast
849102410   912401      0    1420       0       0`,
    explanation: "Rising RX `dropped` counters indicate kernel softnet backlog saturation or socket receive buffer exhaustion."
  },
  {
    id: "net-ip-route-get",
    session: "linux-net",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "ip",
    title: "Ask the kernel routing engine which exact route and source IP it will use for 10.244.2.45",
    prompt: "On a multi-interface host with policy routing (`ip rule`), query the kernel FIB for the exact outgoing interface, gateway, and source IP chosen to reach `10.244.2.45`.",
    canonical: "ip route get 10.244.2.45",
    accepted: ["ip route get 10.244.2.45", "ip r get 10.244.2.45"],
    grammar: [
      { token: "ip route get <ip>", desc: "Execute a live kernel FIB lookup across all routing rules and tables" }
    ],
    sampleOutput: `10.244.2.45 via 10.244.0.0 dev cilium_host src 10.244.0.214 uid 0`,
    explanation: "Essential when Cilium or VPNs use multiple routing tables that don't show up in a plain `ip route`."
  },
  {
    id: "net-ip-promisc",
    session: "linux-net",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "ip",
    title: "Enable promiscuous mode on eth0 for Layer 2 packet sniffing",
    prompt: "Configure network device `eth0` with `promisc on` using `ip link set` so your `AF_PACKET` sniffer receives all frames on the wire.",
    canonical: "ip link set eth0 promisc on",
    accepted: ["ip link set eth0 promisc on", "ip link set dev eth0 promisc on"],
    grammar: [
      { token: "ip link set eth0 promisc on", desc: "Disable NIC hardware MAC filtering and pass all L2 frames to the kernel" }
    ],
    sampleOutput: `(eth0 flags now include PROMISC)`,
    explanation: "Allows raw L2 socket consumers (`tcpdump`, `AF_PACKET`) to inspect frames not addressed to the host's own MAC."
  },
  {
    id: "net-ss-tan",
    session: "linux-net",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "ss",
    title: "List all TCP connections in every state (ESTAB, TIME-WAIT, CLOSE-WAIT, SYN-SENT)",
    prompt: "Inspect **all** TCP sockets (both listening and non-listening/established) with numeric IP addresses and port numbers.",
    canonical: "ss -tan",
    accepted: ["ss -tan", "ss -tanp"],
    grammar: [
      { token: "-t", desc: "TCP sockets" },
      { token: "-a", desc: "All states (ESTAB, LISTEN, TIME-WAIT, CLOSE-WAIT, SYN-SENT)" },
      { token: "-n", desc: "Numeric output" }
    ],
    sampleOutput: `State      Recv-Q Send-Q Local Address:Port   Peer Address:Port
CLOSE-WAIT 1      0      10.244.1.15:8080     10.244.2.20:39104
SYN-SENT   0      1      10.244.1.15:41892    10.96.4.12:5432`,
    explanation: "Accumulating `CLOSE-WAIT` sockets means your application isn't calling `Close()` after the peer disconnects; `SYN-SENT` means outbound handshakes are timing out."
  },
  {
    id: "net-tcpdump-port",
    session: "linux-net",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "tcpdump",
    title: "Capture packets on eth0 for port 80 without DNS or service-name resolution",
    prompt: "Run `tcpdump` on interface `eth0` with numeric host and port output, filtering for `port 80`.",
    canonical: "tcpdump -i eth0 -nn port 80",
    accepted: [
      "tcpdump -i eth0 -nn port 80",
      "tcpdump -nn -i eth0 port 80",
      "tcpdump -i eth0 -n port 80"
    ],
    grammar: [
      { token: "-i eth0", desc: "Capture on interface eth0" },
      { token: "-nn", desc: "Do not resolve IP addresses or port numbers to names" },
      { token: "port 80", desc: "BPF filter matching source or destination port 80" }
    ],
    sampleOutput: `18:25:01.402 IP 10.244.1.15.51244 > 10.244.2.80.80: Flags [S], seq 29481041
18:25:01.402 IP 10.244.2.80.80 > 10.244.1.15.51244: Flags [R.], ack 29481042`,
    explanation: "Always pass `-nn` in production so `tcpdump` doesn't generate reverse-DNS traffic for every packet it captures!"
  },
  {
    id: "net-tcpdump-write-pcap",
    session: "linux-net",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "tcpdump",
    title: "Save raw captured packets on eth0 to capture.pcap",
    prompt: "Capture packets on interface `eth0` and write the raw binary packet data directly to a file named `capture.pcap`.",
    canonical: "tcpdump -i eth0 -w capture.pcap",
    accepted: ["tcpdump -i eth0 -w capture.pcap", "tcpdump -nn -i eth0 -w capture.pcap"],
    grammar: [
      { token: "-i eth0", desc: "Capture interface" },
      { token: "-w capture.pcap", desc: "Write raw packet frames to a pcap file" }
    ],
    sampleOutput: `tcpdump: listening on eth0, link-type EN10MB (Ethernet)`,
    explanation: "Read the saved file later using `tcpdump -nn -r capture.pcap` or open it in Wireshark."
  },
  {
    id: "net-ethtool",
    session: "linux-net",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "ethtool",
    title: "Query physical NIC link speed, duplex, and carrier detection on eth0",
    prompt: "Inspect the physical link speed, duplex mode, and link detection status of network interface `eth0`.",
    canonical: "ethtool eth0",
    accepted: ["ethtool eth0"],
    grammar: [
      { token: "ethtool eth0", desc: "Query physical NIC driver and link settings" }
    ],
    sampleOutput: `Speed: 25000Mb/s
Duplex: Full
Link detected: yes`,
    explanation: "Verifies physical Layer 1 link state and negotiated speed."
  },
  {
    id: "net-ethtool-stats",
    session: "linux-net",
    level: 3,
    difficulty: "Level 3 · Deep Diagnostics",
    tool: "ethtool",
    title: "Inspect NIC hardware ring-buffer drop counters on eth0",
    prompt: "Packets are being dropped at high throughput before reaching the kernel network stack. Query the NIC driver's hardware statistics on `eth0` using `ethtool`.",
    canonical: "ethtool -S eth0",
    accepted: ["ethtool -S eth0"],
    grammar: [
      { token: "ethtool -S eth0", desc: "Dump NIC hardware/driver counters (rx_missed_errors, rx_no_buffer_count)" }
    ],
    sampleOutput: `NIC statistics:
     rx_packets: 94812041
     rx_missed_errors: 1842`,
    explanation: "`rx_missed_errors` in `ethtool -S` proves the NIC hardware RX ring buffer overflowed before the kernel could DMA packets out (fixable by increasing ring size with `ethtool -G eth0 rx 4096`)."
  },
  {
    id: "net-tcpdump-vlan",
    session: "linux-net",
    level: 3,
    difficulty: "Level 3 · Deep Diagnostics",
    tool: "tcpdump",
    title: "Capture packets on eth0 with Layer 2 Ethernet MAC headers and 802.1Q VLAN tags",
    prompt: "Run `tcpdump` on `eth0` with numeric output and link-level Layer 2 headers enabled so you can see source/destination MAC addresses, EtherType (`0x8100`), and 802.1Q VLAN IDs.",
    canonical: "tcpdump -i eth0 -nn -e",
    accepted: ["tcpdump -i eth0 -nn -e", "tcpdump -i eth0 -nne", "tcpdump -nne -i eth0"],
    grammar: [
      { token: "-e", desc: "Print the link-level Layer 2 Ethernet header on each dump line" },
      { token: "-nn", desc: "Numeric IP and port output" }
    ],
    sampleOutput: `18:42:10.114 00:1b:54:c2:10:01 > 52:54:00:6b:3c:11, ethertype 802.1Q (0x8100), vlan 120, ethertype IPv4`,
    explanation: "Essential when verifying Cisco switch trunk ports, VLAN tags, or wrong destination MACs."
  },
  {
    id: "net-ping-mtu",
    session: "linux-net",
    level: 3,
    difficulty: "Level 3 · Deep Diagnostics",
    tool: "ping",
    title: "Diagnose a Path MTU Blackhole using a 1500-byte Don't Fragment probe",
    symptomOutput: `$ curl -v https://10.244.2.10:8443
* Connected to 10.244.2.10 (10.244.2.10) port 8443
* TLSv1.3 (OUT), TLS handshake, Client hello (1):
(stalls indefinitely...)`,
    prompt: "Small TCP handshakes succeed, but large TLS handshakes stall! Test whether a full 1500-byte packet can reach `10.244.2.10` without fragmentation by sending `4` ICMP probes with the Don't Fragment (`do`) mode and payload size `1472`.",
    canonical: "ping -c 4 -M do -s 1472 10.244.2.10",
    accepted: [
      "ping -c 4 -M do -s 1472 10.244.2.10",
      "ping -M do -s 1472 -c 4 10.244.2.10",
      "ping -M do -s 1472 10.244.2.10"
    ],
    grammar: [
      { token: "-M do", desc: "Set the IPv4 Don't Fragment (DF) flag" },
      { token: "-s 1472", desc: "1472B payload + 8B ICMP header + 20B IPv4 header = 1500B total packet" }
    ],
    sampleOutput: `ping: local error: message too long, mtu=1450`,
    explanation: "VXLAN/Geneve overlays add 50 bytes of outer headers, reducing inner MTU from 1500 to 1450."
  },
  {
    id: "net-nsenter-netns",
    session: "linux-net",
    level: 3,
    difficulty: "Level 3 · Deep Diagnostics",
    tool: "nsenter",
    title: "Execute ss -tulpn inside a distroless container's network namespace from the host",
    prompt: "A distroless container has no shell or networking tools inside it, and its host PID is `14820`. Use `nsenter` to enter PID `14820`'s network namespace and run `ss -tulpn` using the host's binary.",
    canonical: "nsenter -t 14820 -n ss -tulpn",
    accepted: ["nsenter -t 14820 -n ss -tulpn", "nsenter -n -t 14820 ss -tulpn"],
    grammar: [
      { token: "nsenter -t 14820", desc: "Target host PID 14820" },
      { token: "-n", desc: "Enter only the network namespace (/proc/14820/ns/net)" },
      { token: "ss -tulpn", desc: "Run the host's ss binary inside the container's network stack" }
    ],
    sampleOutput: `Netid State  Recv-Q Send-Q Local Address:Port  Peer Address:Port Process
tcp   LISTEN 0      4096   *:8080              *:*               users:(("app",pid=14820,fd=3))`,
    explanation: "You can run `tcpdump`, `ss`, or `ip` inside any pod's network namespace from the worker node using `nsenter -t <pid> -n`."
  },

  // ============================================================================
  // TRACK 4: DOCKER & CONTAINERD (crictl)
  // ============================================================================
  {
    id: "cnt-docker-ps-a",
    session: "containers",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "docker",
    title: "List all Docker containers including stopped and crashed ones",
    prompt: "List all Docker containers on the host, including those that have exited or crashed.",
    canonical: "docker ps -a",
    accepted: ["docker ps -a", "docker ps --all", "docker container ls -a"],
    grammar: [
      { token: "docker ps -a", desc: "List all containers regardless of state (Running, Exited, Created)" }
    ],
    sampleOutput: `CONTAINER ID   IMAGE          STATUS                     NAMES
c19a04e2b77d   frametap:dev   Exited (1) 2 minutes ago   sniffer-test`,
    explanation: "Crashed containers are hidden by default unless `-a` is passed."
  },
  {
    id: "cnt-docker-images",
    session: "containers",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "docker",
    title: "List locally cached Docker images and their sizes",
    prompt: "List all locally stored container images, their tags, IDs, and disk sizes.",
    canonical: "docker images",
    accepted: ["docker images", "docker image ls"],
    grammar: [
      { token: "docker images", desc: "List locally stored container images" }
    ],
    sampleOutput: `REPOSITORY   TAG      IMAGE ID       CREATED       SIZE
frametap     latest   4e81d9a02f1b   2 hours ago   18.4MB`,
    explanation: "Shows image repositories, tags, and uncompressed sizes on disk."
  },
  {
    id: "cnt-docker-logs",
    session: "containers",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "docker",
    title: "Follow live stdout/stderr logs of container api-gateway",
    prompt: "Stream the live logs of the Docker container named `api-gateway` in real time.",
    canonical: "docker logs -f api-gateway",
    accepted: ["docker logs -f api-gateway", "docker logs --follow api-gateway"],
    grammar: [
      { token: "docker logs -f api-gateway", desc: "Follow live stdout/stderr output of container api-gateway" }
    ],
    sampleOutput: `2026-11-02T18:30:04Z ERROR upstream timeout dialing tcp 10.96.4.12:5432`,
    explanation: "Combine with `--tail 100` on long-running containers."
  },
  {
    id: "cnt-docker-exec",
    session: "containers",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "docker",
    title: "Open an interactive sh shell inside running container kind-control-plane",
    prompt: "Start an interactive pseudo-TTY `sh` session inside the running Docker container `kind-control-plane`.",
    canonical: "docker exec -it kind-control-plane sh",
    accepted: [
      "docker exec -it kind-control-plane sh",
      "docker exec -it kind-control-plane bash",
      "docker exec -ti kind-control-plane sh"
    ],
    grammar: [
      { token: "docker exec -it", desc: "Run an interactive (-i) TTY (-t) command inside an existing container" }
    ],
    sampleOutput: `# hostname
kind-control-plane`,
    explanation: "Drops you inside the container's namespaces (PID, mount, network, UTS)."
  },
  {
    id: "cnt-docker-stats",
    session: "containers",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "docker",
    title: "Monitor live CPU, memory, and I/O usage across running containers",
    prompt: "Display a live stream of CPU, memory usage/limit, network I/O, and PIDs for all running Docker containers.",
    canonical: "docker stats",
    accepted: ["docker stats", "docker stats --no-stream"],
    grammar: [
      { token: "docker stats", desc: "Stream live container cgroup resource metrics" }
    ],
    sampleOutput: `CONTAINER ID   NAME                 CPU %     MEM USAGE / LIMIT     MEM %
8f3d12a9c4b1   kind-control-plane   12.45%    1.42GiB / 7.75GiB     18.32%`,
    explanation: "Reads live metrics from the host's cgroup hierarchy."
  },
  {
    id: "cnt-docker-inspect",
    session: "containers",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "docker",
    title: "Dump low-level JSON state, host PID, and OOMKilled flag of container api-gateway",
    prompt: "Inspect the low-level JSON configuration and runtime state of container `api-gateway`.",
    canonical: "docker inspect api-gateway",
    accepted: ["docker inspect api-gateway", "docker container inspect api-gateway"],
    grammar: [
      { token: "docker inspect api-gateway", desc: "Output full JSON metadata (State.Pid, State.OOMKilled, Mounts, NetworkSettings)" }
    ],
    sampleOutput: `"State": { "Status": "running", "Pid": 14820, "OOMKilled": false }`,
    explanation: "Reveals `State.OOMKilled`, `State.ExitCode`, `State.Pid` (host PID), and container IP."
  },
  {
    id: "cnt-docker-network-ls",
    session: "containers",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "docker",
    title: "List all Docker networks on the host",
    prompt: "List all networks created in Docker along with their network drivers.",
    canonical: "docker network ls",
    accepted: ["docker network ls", "docker network list"],
    grammar: [
      { token: "docker network ls", desc: "List Docker networks (bridge, host, null, overlay)" }
    ],
    sampleOutput: `NETWORK ID     NAME      DRIVER    SCOPE
7c8d9e0f1a2b   kind      bridge    local`,
    explanation: "Shows all bridge, host, and custom networks."
  },
  {
    id: "cnt-docker-network-inspect",
    session: "containers",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "docker",
    title: "Inspect subnet CIDR and attached container IPs on Docker network 'kind'",
    prompt: "Inspect the detailed JSON configuration (subnet CIDR, gateway, and attached containers) of the Docker network named `kind`.",
    canonical: "docker network inspect kind",
    accepted: ["docker network inspect kind", "docker network inspect bridge"],
    grammar: [
      { token: "docker network inspect kind", desc: "Show IPAM subnet/gateway and connected container endpoints for network 'kind'" }
    ],
    sampleOutput: `"IPAM": { "Config": [{ "Subnet": "172.18.0.0/16", "Gateway": "172.18.0.1" }] }`,
    explanation: "Shows the exact IPv4/IPv6 addresses assigned to every Kind node container."
  },
  {
    id: "cnt-docker-events",
    session: "containers",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "docker",
    title: "Stream real-time container lifecycle events (oom, die, start) from Docker",
    prompt: "Watch real-time lifecycle events emitted by the Docker daemon.",
    canonical: "docker events",
    accepted: ["docker events", "docker system events"],
    grammar: [
      { token: "docker events", desc: "Stream real-time daemon events (container start, die, oom, network connect)" }
    ],
    sampleOutput: `2026-11-02T18:34:11Z container oom c19a04e2b77d (name=sniffer-test)`,
    explanation: "Immediately confirms if a container was killed by the cgroup OOM killer (`container oom`)."
  },
  {
    id: "cnt-crictl-ps",
    session: "containers",
    level: 3,
    difficulty: "Level 3 · Deep Diagnostics",
    tool: "crictl",
    title: "List all containers on a Kubernetes node using containerd's CRI CLI",
    prompt: "You SSH'd into a Kubernetes worker node running `containerd`. List all containers on the node—including exited ones—using the CRI CLI (`crictl`).",
    canonical: "crictl ps -a",
    accepted: ["crictl ps -a", "crictl ps --all"],
    grammar: [
      { token: "crictl ps -a", desc: "List all CRI containers (Running and Exited) on the local Kubernetes node" }
    ],
    sampleOutput: `CONTAINER       IMAGE           CREATED       STATE     NAME           ATTEMPT
4b2e91f0a11c2   92b1e3f80c21a   3 hours ago   Running   cilium-agent   0`,
    explanation: "When `kube-apiserver` or `kubelet` is down, `crictl` on the node is how you inspect static pods (`etcd`, `kube-apiserver`, `cilium`)."
  },
  {
    id: "cnt-crictl-pods",
    session: "containers",
    level: 3,
    difficulty: "Level 3 · Deep Diagnostics",
    tool: "crictl",
    title: "List all Pod sandboxes on a Kubernetes worker node using crictl",
    prompt: "On a Kubernetes node, list all Pod sandboxes managed by the Container Runtime Interface using `crictl`.",
    canonical: "crictl pods",
    accepted: ["crictl pods"],
    grammar: [
      { token: "crictl pods", desc: "List Pod sandboxes on the local node" }
    ],
    sampleOutput: `POD ID          CREATED       STATE   NAME           NAMESPACE     ATTEMPT
e81a02c4d91b0   3 hours ago   Ready   cilium-7x92k   kube-system   0`,
    explanation: "Each Pod sandbox holds the shared network namespace (`netns`) for all containers in that Pod."
  },
  {
    id: "cnt-crictl-logs",
    session: "containers",
    level: 3,
    difficulty: "Level 3 · Deep Diagnostics",
    tool: "crictl",
    title: "Fetch container logs directly from containerd using crictl",
    prompt: "Container `9d01a8c3e22f1` crashed on a worker node and the Kubernetes API server is unreachable. Fetch its logs using `crictl`.",
    canonical: "crictl logs 9d01a8c3e22f1",
    accepted: ["crictl logs 9d01a8c3e22f1", "crictl logs -f 9d01a8c3e22f1"],
    grammar: [
      { token: "crictl logs <container-id>", desc: "Read container logs directly from the local CRI runtime" }
    ],
    sampleOutput: `FATAL failed to open AF_PACKET socket: operation not permitted (missing CAP_NET_RAW)`,
    explanation: "You can also run `crictl inspect 9d01a8c3e22f1` to inspect capabilities, mounts, and host PID."
  },

  // ============================================================================
  // TRACK 5: LINUX SERVICES, SYSTEMD & KERNEL LOGS
  // ============================================================================
  {
    id: "sys-systemctl-status",
    session: "systemd-logs",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "systemctl",
    title: "Check the runtime status and main PID of the kubelet service",
    prompt: "Check whether the `kubelet` systemd service is active/running, its main PID, and its recent log lines.",
    canonical: "systemctl status kubelet",
    accepted: ["systemctl status kubelet", "systemctl status kubelet.service"],
    grammar: [
      { token: "systemctl status kubelet", desc: "Inspect systemd unit status, cgroup tree, and recent journal lines" }
    ],
    sampleOutput: `● kubelet.service - kubelet: The Kubernetes Node Agent
     Active: active (running) since Mon 2026-11-02 09:00:12 UTC; 9h ago`,
    explanation: "First check when a Kubernetes worker node flips to `NotReady`."
  },
  {
    id: "sys-systemctl-restart",
    session: "systemd-logs",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "systemctl",
    title: "Restart the containerd systemd service",
    prompt: "You updated `/etc/containerd/config.toml`. Restart the `containerd` systemd service so the new configuration takes effect.",
    canonical: "systemctl restart containerd",
    accepted: ["systemctl restart containerd", "systemctl restart containerd.service"],
    grammar: [
      { token: "systemctl restart containerd", desc: "Stop and start the containerd systemd service" }
    ],
    sampleOutput: `(containerd.service restarted cleanly)`,
    explanation: "If you modified a `.service` unit file itself, run `systemctl daemon-reload` first."
  },
  {
    id: "sys-journalctl-f",
    session: "systemd-logs",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "journalctl",
    title: "Stream all new systemd journal log entries in real time",
    prompt: "Follow the system-wide systemd journal in real time so new log messages stream to your terminal.",
    canonical: "journalctl -f",
    accepted: ["journalctl -f"],
    grammar: [
      { token: "journalctl -f", desc: "Follow the live systemd journal stream" }
    ],
    sampleOutput: `Nov 02 22:12:01 node-1 sshd[8192]: Accepted publickey for sanjeev`,
    explanation: "Equivalent to `tail -f /var/log/syslog` on systemd-based Linux distributions."
  },
  {
    id: "sys-journalctl-unit",
    session: "systemd-logs",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "journalctl",
    title: "Stream real-time systemd journal logs specifically for kubelet",
    prompt: "Follow the live systemd journal filtered specifically for the `kubelet` service unit.",
    canonical: "journalctl -u kubelet -f",
    accepted: [
      "journalctl -u kubelet -f",
      "journalctl -f -u kubelet",
      "journalctl -fu kubelet",
      "journalctl -uf kubelet"
    ],
    grammar: [
      { token: "-u kubelet", desc: "Filter logs for unit kubelet.service" },
      { token: "-f", desc: "Follow live log output" }
    ],
    sampleOutput: `Nov 02 18:36:10 node-1 kubelet[1294]: E1102 "Error syncing pod" err="cni failed to set up pod network"`,
    explanation: "Pinpoints CNI plugin failures, PLEG health issues, and certificate errors on a worker node."
  },
  {
    id: "sys-journalctl-xe",
    session: "systemd-logs",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "journalctl",
    title: "Jump to the end of the systemd journal with explanatory error context",
    prompt: "A systemd daemon just failed to start. Open `journalctl` jumped directly to the end of the log with explanatory catalog messages enabled.",
    canonical: "journalctl -xe",
    accepted: ["journalctl -xe", "journalctl -ex"],
    grammar: [
      { token: "-x", desc: "Augment log lines with explanatory catalog text" },
      { token: "-e", desc: "Jump immediately to the end of the journal" }
    ],
    sampleOutput: `░░ The unit nginx.service has entered the 'failed' state with result 'exit-code'.`,
    explanation: "Also remember `journalctl -b -1` to inspect logs from the previous boot after an unexpected kernel panic/reboot."
  },
  {
    id: "sys-systemctl-failed",
    session: "systemd-logs",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "systemctl",
    title: "List all systemd units currently in a failed state",
    prompt: "List all systemd services/units on the host that are currently in the `--failed` state.",
    canonical: "systemctl list-units --failed",
    accepted: ["systemctl list-units --failed", "systemctl --failed"],
    grammar: [
      { token: "systemctl list-units --failed", desc: "Filter unit list to only failed services" }
    ],
    sampleOutput: `● kubelet.service loaded failed failed kubelet: The Kubernetes Node Agent`,
    explanation: "Quickly spots any crashed background daemon across the entire host."
  },
  {
    id: "sys-dmesg-t",
    session: "systemd-logs",
    level: 3,
    difficulty: "Level 3 · Deep Diagnostics",
    tool: "dmesg",
    title: "Inspect the Linux kernel ring buffer with human-readable timestamps",
    symptomOutput: `Last State:     Terminated
  Reason:       Error
  Exit Code:    137`,
    prompt: "A process exited with code `137` (`SIGKILL`) and you suspect the Linux kernel OOM killer or a kernel subsystem event. Print the kernel ring buffer (`dmesg`) with human-readable timestamps.",
    canonical: "dmesg -T",
    accepted: ["dmesg -T", "dmesg --ctime", "dmesg -Tw"],
    grammar: [
      { token: "dmesg", desc: "Print kernel ring buffer messages" },
      { token: "-T", desc: "Format timestamps as human-readable local dates/times" }
    ],
    sampleOutput: `[Mon Nov  2 18:34:11 2026] Out of memory: Killed process 9842 (frametap) anon-rss:512400kB
[Mon Nov  2 18:35:02 2026] nf_conntrack: nf_conntrack: table full, dropping packet`,
    explanation: "`dmesg -T` is the authoritative source for kernel OOM kills, `nf_conntrack: table full` packet drops, and NIC/disk hardware resets."
  },

  // ============================================================================
  // TRACK 6: KUBERNETES (kubectl) DEBUGGING
  // ============================================================================
  {
    id: "k8s-get-pods-wide",
    session: "kubectl",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "kubectl",
    title: "List all pods across all namespaces with Pod IPs and Node names",
    prompt: "List all Pods across every namespace with extended columns showing each Pod's IP address and scheduled Node.",
    canonical: "kubectl get pods -A -o wide",
    accepted: [
      "kubectl get pods -A -o wide",
      "kubectl get pods -o wide -A",
      "kubectl get po -A -o wide",
      "kubectl get po -o wide -A",
      "kubectl get pods --all-namespaces -o wide"
    ],
    grammar: [
      { token: "kubectl get pods -A", desc: "List pods across all namespaces" },
      { token: "-o wide", desc: "Output additional IP and NODE columns" }
    ],
    sampleOutput: `NAMESPACE   NAME                           READY   STATUS             IP           NODE
prod        payment-api-6d4f8b9c7-x2k9p    0/1     CrashLoopBackOff   10.244.1.48  kind-worker`,
    explanation: "Immediately tells you which worker node and Pod IP a workload is running on."
  },
  {
    id: "k8s-describe-pod",
    session: "kubectl",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "kubectl",
    title: "Inspect detailed pod conditions, exit codes, and Events for payment-api",
    prompt: "Pod `payment-api` is stuck in `Pending` or `CrashLoopBackOff`. Inspect its detailed state, container termination reasons, and kubelet Events.",
    canonical: "kubectl describe pod payment-api",
    accepted: ["kubectl describe pod payment-api", "kubectl describe po payment-api", "kubectl describe pod/payment-api"],
    grammar: [
      { token: "kubectl describe pod payment-api", desc: "Show detailed human-readable state and Events for pod payment-api" }
    ],
    sampleOutput: `Last State:     Terminated (Reason: OOMKilled, Exit Code: 137)
Events:
  Warning  BackOff  12s (x5 over 92s)  kubelet  Back-off restarting failed container`,
    explanation: "The bottom `Events:` section reveals scheduling failures, image pull errors, CNI setup issues, and failed probes."
  },
  {
    id: "k8s-exec-shell",
    session: "kubectl",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "kubectl",
    title: "Open an interactive sh shell inside pod payment-api",
    prompt: "Execute an interactive pseudo-TTY `sh` shell inside the running pod `payment-api`.",
    canonical: "kubectl exec -it payment-api -- sh",
    accepted: [
      "kubectl exec -it payment-api -- sh",
      "kubectl exec -it payment-api -- /bin/sh",
      "kubectl exec -it payment-api -- bash",
      "kubectl exec -it payment-api sh"
    ],
    grammar: [
      { token: "kubectl exec -it payment-api -- sh", desc: "Open interactive shell inside pod payment-api" }
    ],
    sampleOutput: `/app #`,
    explanation: "Add `-c <container>` when the pod has multiple containers (such as an Envoy service-mesh sidecar)."
  },
  {
    id: "k8s-top-pods",
    session: "kubectl",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "kubectl",
    title: "View live CPU and memory usage of pods across all namespaces",
    prompt: "Query live CPU (millicores) and memory usage for all pods across all namespaces using `kubectl top`.",
    canonical: "kubectl top pods -A",
    accepted: ["kubectl top pods -A", "kubectl top pod -A", "kubectl top po -A"],
    grammar: [
      { token: "kubectl top pods -A", desc: "Show live pod CPU and memory metrics across all namespaces" }
    ],
    sampleOutput: `NAMESPACE   NAME                           CPU(cores)   MEMORY(bytes)
prod        payment-api-6d4f8b9c7-x2k9p    420m         498Mi`,
    explanation: "Use `kubectl top nodes` to inspect node-level CPU and memory pressure."
  },
  {
    id: "k8s-logs-previous",
    session: "kubectl",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "kubectl",
    title: "Fetch logs from the previous crashed container instance of payment-api",
    prompt: "Pod `payment-api` just restarted in a `CrashLoopBackOff`, so its current container log is empty. Fetch the logs from its **previous** terminated container instance.",
    canonical: "kubectl logs payment-api --previous",
    accepted: [
      "kubectl logs payment-api --previous",
      "kubectl logs -p payment-api",
      "kubectl logs payment-api -p",
      "kubectl logs --previous payment-api"
    ],
    grammar: [
      { token: "--previous", desc: "(Or -p) Print logs from the previous crashed container instantiation" }
    ],
    sampleOutput: `panic: runtime error: invalid memory address or nil pointer dereference`,
    explanation: "Retrieves the panic stack trace or fatal error from the container that just died."
  },
  {
    id: "k8s-get-events-sorted",
    session: "kubectl",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "kubectl",
    title: "List Kubernetes events sorted chronologically by creationTimestamp",
    prompt: "List cluster events in the current namespace sorted chronologically by `.metadata.creationTimestamp`.",
    canonical: "kubectl get events --sort-by=.metadata.creationTimestamp",
    accepted: [
      "kubectl get events --sort-by=.metadata.creationTimestamp",
      "kubectl get ev --sort-by=.metadata.creationTimestamp"
    ],
    grammar: [
      { token: "--sort-by=.metadata.creationTimestamp", desc: "Sort events chronologically using JSONPath" }
    ],
    sampleOutput: `2m05s  Warning  Unhealthy  pod/payment-api  Readiness probe failed: HTTP 503`,
    explanation: "Plain `kubectl get events` is unsorted; sorting by `.metadata.creationTimestamp` gives a true incident timeline."
  },
  {
    id: "k8s-rollout-undo",
    session: "kubectl",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "kubectl",
    title: "Roll back Deployment payment-api to its previous revision",
    prompt: "A bad release of `deployment/payment-api` is causing errors. Roll back `deployment/payment-api` to its previous working revision.",
    canonical: "kubectl rollout undo deployment/payment-api",
    accepted: [
      "kubectl rollout undo deployment/payment-api",
      "kubectl rollout undo deployment payment-api",
      "kubectl rollout undo deploy/payment-api",
      "kubectl rollout undo deploy payment-api"
    ],
    grammar: [
      { token: "kubectl rollout undo deployment/payment-api", desc: "Revert Deployment to its prior ReplicaSet revision" }
    ],
    sampleOutput: `deployment.apps/payment-api rolled back`,
    explanation: "Monitor rollback progress with `kubectl rollout status deployment/payment-api`."
  },
  {
    id: "k8s-port-forward",
    session: "kubectl",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "kubectl",
    title: "Tunnel local port 9090 to port 9090 on pod prometheus-0",
    prompt: "Forward local TCP port `9090` to port `9090` on pod `prometheus-0`.",
    canonical: "kubectl port-forward prometheus-0 9090:9090",
    accepted: [
      "kubectl port-forward prometheus-0 9090:9090",
      "kubectl port-forward pod/prometheus-0 9090:9090"
    ],
    grammar: [
      { token: "kubectl port-forward prometheus-0 9090:9090", desc: "Forward local 127.0.0.1:9090 to pod port 9090" }
    ],
    sampleOutput: `Forwarding from 127.0.0.1:9090 -> 9090`,
    explanation: "Useful for accessing internal metrics, admin UIs, or Go `pprof` endpoints on a pod."
  },
  {
    id: "k8s-get-endpoints",
    session: "kubectl",
    level: 3,
    difficulty: "Level 3 · Deep Diagnostics",
    tool: "kubectl",
    title: "Check whether Service payment-svc has any Ready backend Pod IPs",
    symptomOutput: `$ curl http://payment-svc.default.svc.cluster.local:8080
curl: (7) Failed to connect to payment-svc.default.svc.cluster.local port 8080: Connection refused`,
    prompt: "Requests to ClusterIP service `payment-svc` fail with `Connection refused`. Inspect the `endpoints` resource for `payment-svc` to verify whether any Ready Pod IPs are registered behind the Service.",
    canonical: "kubectl get endpoints payment-svc",
    accepted: ["kubectl get endpoints payment-svc", "kubectl get ep payment-svc", "kubectl describe endpoints payment-svc"],
    grammar: [
      { token: "kubectl get endpoints payment-svc", desc: "Show backend Pod IP:Port targets populated for Service payment-svc" }
    ],
    sampleOutput: `NAME          ENDPOINTS   AGE
payment-svc   <none>      14m`,
    explanation: "If `ENDPOINTS` is `<none>`, either the Service's label selector doesn't match the Pod labels, or all matching Pods are failing their `readinessProbe`."
  },
  {
    id: "k8s-drain-node",
    session: "kubectl",
    level: 3,
    difficulty: "Level 3 · Deep Diagnostics",
    tool: "kubectl",
    title: "Safely drain node kind-worker for kernel maintenance while ignoring DaemonSets",
    prompt: "Evict all workloads from node `kind-worker` for maintenance while ignoring DaemonSet-managed pods (`--ignore-daemonsets`).",
    canonical: "kubectl drain kind-worker --ignore-daemonsets",
    accepted: [
      "kubectl drain kind-worker --ignore-daemonsets",
      "kubectl drain kind-worker --ignore-daemonsets --delete-emptydir-data"
    ],
    grammar: [
      { token: "kubectl drain kind-worker", desc: "Cordon node unschedulable and gracefully evict pods" },
      { token: "--ignore-daemonsets", desc: "Skip DaemonSet pods (like cilium-agent and kube-proxy) that belong on every node" }
    ],
    sampleOutput: `node/kind-worker cordoned
node/kind-worker drained`,
    explanation: "Once maintenance is complete, run `kubectl uncordon kind-worker` to allow scheduling again."
  },

  // ============================================================================
  // TRACK 7: HELM, CILIUM & HUBBLE (eBPF / CNI)
  // ============================================================================
  {
    id: "hc-helm-list",
    session: "helm-cilium",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "helm",
    title: "List all deployed Helm releases across all namespaces",
    prompt: "List all Helm releases installed across every namespace in the cluster.",
    canonical: "helm list -A",
    accepted: ["helm list -A", "helm ls -A", "helm list --all-namespaces"],
    grammar: [
      { token: "helm list -A", desc: "List Helm releases across all namespaces" }
    ],
    sampleOutput: `NAME     NAMESPACE     REVISION  STATUS    CHART          APP VERSION
cilium   kube-system   2         deployed  cilium-1.16.3  1.16.3`,
    explanation: "Without `-A`, Helm only lists releases in your current kubeconfig namespace."
  },
  {
    id: "hc-cilium-status",
    session: "helm-cilium",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "cilium",
    title: "Check Cilium CNI agent, Operator, and Hubble health",
    prompt: "Run the Cilium CLI command to inspect the health of Cilium agents, Operator, and Hubble across the cluster.",
    canonical: "cilium status",
    accepted: ["cilium status", "cilium status --wait"],
    grammar: [
      { token: "cilium status", desc: "Check Cilium DaemonSet, Operator, IPAM, and Hubble status" }
    ],
    sampleOutput: `Cilium:             OK
Operator:           OK
Hubble Relay:       OK`,
    explanation: "First command to run when checking CNI health."
  },
  {
    id: "hc-hubble-observe",
    session: "helm-cilium",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "hubble",
    title: "Observe live network flows across the cluster using Hubble",
    prompt: "Use the Hubble CLI to observe network flows captured by Cilium eBPF.",
    canonical: "hubble observe",
    accepted: ["hubble observe", "hubble observe -f"],
    grammar: [
      { token: "hubble observe", desc: "Query L3/L4/L7 eBPF network flow telemetry from Hubble" }
    ],
    sampleOutput: `Nov  2 18:40:02 default/frontend-7d4b:41822 -> kube-system/coredns-8b:53 to-endpoint FORWARDED UDP`,
    explanation: "Provides instant visibility into pod-to-pod and DNS flows without running `tcpdump` on nodes."
  },
  {
    id: "hc-helm-get-values",
    session: "helm-cilium",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "helm",
    title: "Inspect custom override values applied to Helm release 'cilium'",
    prompt: "Fetch the user-supplied configuration values for the deployed Helm release named `cilium`.",
    canonical: "helm get values cilium",
    accepted: ["helm get values cilium", "helm get values cilium -a"],
    grammar: [
      { token: "helm get values cilium", desc: "Download user-supplied override values for release 'cilium'" }
    ],
    sampleOutput: `USER-SUPPLIED VALUES:
kubeProxyReplacement: true`,
    explanation: "Shows exactly which custom Helm values are active in the cluster."
  },
  {
    id: "hc-helm-history",
    session: "helm-cilium",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "helm",
    title: "Check revision history of Helm release 'prometheus'",
    prompt: "Display the revision history of the `prometheus` Helm release so you can see previous revision numbers and statuses.",
    canonical: "helm history prometheus",
    accepted: ["helm history prometheus"],
    grammar: [
      { token: "helm history prometheus", desc: "List historical revisions for release 'prometheus'" }
    ],
    sampleOutput: `REVISION  STATUS      CHART             DESCRIPTION
3         superseded  kube-prom-65.0    Upgrade complete
4         failed      kube-prom-65.1    Upgrade "prometheus" failed`,
    explanation: "Always check `helm history` before running `helm rollback`."
  },
  {
    id: "hc-helm-rollback",
    session: "helm-cilium",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "helm",
    title: "Rollback Helm release 'prometheus' to revision 3",
    prompt: "Revision 4 of `prometheus` failed. Roll back the `prometheus` Helm release to revision `3`.",
    canonical: "helm rollback prometheus 3",
    accepted: ["helm rollback prometheus 3"],
    grammar: [
      { token: "helm rollback prometheus 3", desc: "Roll back release 'prometheus' to revision 3" }
    ],
    sampleOutput: `Rollback was a success! Happy Helming!`,
    explanation: "Restores the manifests and configuration from revision 3."
  },
  {
    id: "hc-helm-template",
    session: "helm-cilium",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "helm",
    title: "Render Helm chart templates locally to stdout",
    prompt: "Render the Kubernetes YAML manifests for release `my-app` from chart directory `./chart` locally without contacting a cluster.",
    canonical: "helm template my-app ./chart",
    accepted: ["helm template my-app ./chart", "helm template ./chart"],
    grammar: [
      { token: "helm template my-app ./chart", desc: "Render chart templates locally to stdout" }
    ],
    sampleOutput: `apiVersion: apps/v1
kind: Deployment`,
    explanation: "Validates template rendering client-side before deploying."
  },
  {
    id: "hc-cilium-connectivity",
    session: "helm-cilium",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "cilium",
    title: "Run Cilium's automated end-to-end connectivity test suite",
    prompt: "Run the Cilium CLI command that deploys test pods and verifies pod-to-pod, service, DNS, and NetworkPolicy connectivity.",
    canonical: "cilium connectivity test",
    accepted: ["cilium connectivity test"],
    grammar: [
      { token: "cilium connectivity test", desc: "Run end-to-end eBPF datapath and policy verification suite" }
    ],
    sampleOutput: `✅ [cilium-test] All 42 tests (298 actions) successful`,
    explanation: "Verifies that CNI routing, masquerading, and policy enforcement work across nodes."
  },
  {
    id: "hc-hubble-observe-drop",
    session: "helm-cilium",
    level: 3,
    difficulty: "Level 3 · Deep Diagnostics",
    tool: "hubble",
    title: "Filter Hubble flows to show only DROPPED packets",
    prompt: "A microservice is timing out after a NetworkPolicy change. Use `hubble observe` to display only flows whose verdict is `DROPPED`.",
    canonical: "hubble observe --verdict DROPPED",
    accepted: ["hubble observe --verdict DROPPED"],
    grammar: [
      { token: "hubble observe --verdict DROPPED", desc: "Show only flows dropped by Cilium eBPF policy or L3/L4 errors" }
    ],
    sampleOutput: `Nov  2 18:45:12 default/checkout-5b9d:39104 -> default/payments-8c1a:8443 PolicyVerdict:all EGRESS DROPPED`,
    explanation: "Pinpoints whether an `INGRESS` or `EGRESS` policy denied the packet."
  },
  {
    id: "hc-cilium-monitor-drop",
    session: "helm-cilium",
    level: 3,
    difficulty: "Level 3 · Deep Diagnostics",
    tool: "cilium",
    title: "Stream low-level eBPF packet drop events directly from the Cilium agent",
    prompt: "Run `cilium monitor` filtered specifically for event type `drop`.",
    canonical: "cilium monitor --type drop",
    accepted: ["cilium monitor --type drop", "cilium-dbg monitor --type drop"],
    grammar: [
      { token: "cilium monitor --type drop", desc: "Stream packet drop events from the kernel eBPF ring buffer" }
    ],
    sampleOutput: `xx drop (Policy denied) flow 0x8a41 to endpoint 1042, file bpf_lxc.c:1984`,
    explanation: "Shows the exact Cilium eBPF C source file and line number (`bpf_lxc.c:1984`) where the packet was dropped."
  },
  {
    id: "hc-cilium-bpf-lb",
    session: "helm-cilium",
    level: 3,
    difficulty: "Level 3 · Deep Diagnostics",
    tool: "cilium",
    title: "Dump Cilium's in-kernel eBPF load-balancer service map",
    prompt: "Cilium is running in kube-proxy replacement mode. Inspect the kernel eBPF load-balancer (`lb`) map entries using `cilium bpf`.",
    canonical: "cilium bpf lb list",
    accepted: ["cilium bpf lb list", "cilium-dbg bpf lb list", "cilium service list"],
    grammar: [
      { token: "cilium bpf lb list", desc: "List Service VIP -> Backend Pod IP mappings in Cilium's kernel BPF map" }
    ],
    sampleOutput: `SERVICE ADDRESS      BACKEND ADDRESS (REVNAT_ID) (SLOT)
10.96.0.10:53/UDP    10.244.0.41:53 (2) (1)`,
    explanation: "Verifies that Kubernetes Service VIPs are programmed into the eBPF datapath."
  },

  // ============================================================================
  // TRACK 8: GIT, TERRAFORM, GO & PROMQL
  // ============================================================================
  {
    id: "gtg-git-status",
    session: "git-tf-go",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "git",
    title: "Check Git working tree and staging area status",
    prompt: "Display modified, staged, and untracked files in your Git repository.",
    canonical: "git status",
    accepted: ["git status", "git status -s"],
    grammar: [
      { token: "git status", desc: "Show working tree status" }
    ],
    sampleOutput: `On branch main
modified:   pkg/sniffer/afpacket.go`,
    explanation: "Shows staged, unstaged, and untracked files."
  },
  {
    id: "gtg-git-log-oneline",
    session: "git-tf-go",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "git",
    title: "View compact Git commit history with one line per commit",
    prompt: "Display the Git commit log formatted concisely as one line per commit.",
    canonical: "git log --oneline",
    accepted: ["git log --oneline", "git log --oneline --graph"],
    grammar: [
      { token: "git log --oneline", desc: "Show abbreviated commit SHA and commit title on a single line" }
    ],
    sampleOutput: `9f81a2c (HEAD -> main) feat(arp): decode IPv4 over Ethernet ARP replies`,
    explanation: "Combine with `--graph` to visualize branch merges."
  },
  {
    id: "gtg-go-test-all",
    session: "git-tf-go",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "go",
    title: "Run all Go unit tests recursively across every package in the module",
    prompt: "Run `go test` across the current directory and all nested subdirectories/packages.",
    canonical: "go test ./...",
    accepted: ["go test ./...", "go test -v ./...", "go test -race ./..."],
    grammar: [
      { token: "go test ./...", desc: "Recursively test all packages in the module" }
    ],
    sampleOutput: `ok  	github.com/Sanjeevliv/frametap/pkg/ethernet	0.014s`,
    explanation: "The `./...` pattern matches all packages in the current module tree."
  },
  {
    id: "gtg-go-vet",
    session: "git-tf-go",
    level: 1,
    difficulty: "Level 1 · Foundation",
    tool: "go",
    title: "Run Go static analysis across all packages in the module",
    prompt: "Run Go's built-in static analyzer (`vet`) across all packages in the repository.",
    canonical: "go vet ./...",
    accepted: ["go vet ./..."],
    grammar: [
      { token: "go vet ./...", desc: "Check all packages for suspicious constructs (e.g. copying mutexes by value)" }
    ],
    sampleOutput: `pkg/sniffer/capture.go:88:14: call of fmt.Printf copies lock value: sync.Mutex`,
    explanation: "Catches subtle bugs that pass compilation."
  },
  {
    id: "gtg-git-diff-staged",
    session: "git-tf-go",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "git",
    title: "View the line-by-line diff of changes staged in the Git index",
    prompt: "You ran `git add` and want to inspect the exact diff of your staged changes before committing.",
    canonical: "git diff --staged",
    accepted: ["git diff --staged", "git diff --cached"],
    grammar: [
      { token: "git diff --staged", desc: "Diff staged index changes against HEAD" }
    ],
    sampleOutput: `+	fd, err := unix.Socket(unix.AF_PACKET, unix.SOCK_RAW, int(htons(unix.ETH_P_ALL)))`,
    explanation: "Plain `git diff` only shows unstaged changes; `--staged` shows what will actually be committed."
  },
  {
    id: "gtg-git-switch-c",
    session: "git-tf-go",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "git",
    title: "Create and switch to a new branch named fix/mtu using git switch",
    prompt: "Use `git switch` to create and immediately switch to a new branch named `fix/mtu`.",
    canonical: "git switch -c fix/mtu",
    accepted: ["git switch -c fix/mtu", "git checkout -b fix/mtu"],
    grammar: [
      { token: "git switch -c fix/mtu", desc: "Create (-c) and switch to branch fix/mtu" }
    ],
    sampleOutput: `Switched to a new branch 'fix/mtu'`,
    explanation: "Modern replacement for `git checkout -b`."
  },
  {
    id: "gtg-git-restore",
    session: "git-tf-go",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "git",
    title: "Discard unstaged working-tree edits in main.go",
    prompt: "Discard uncommitted working-tree modifications in `main.go` using `git restore`.",
    canonical: "git restore main.go",
    accepted: ["git restore main.go", "git checkout -- main.go"],
    grammar: [
      { token: "git restore main.go", desc: "Restore working-tree file main.go to match the index" }
    ],
    sampleOutput: `(main.go restored)`,
    explanation: "Add `--staged` (`git restore --staged main.go`) to unstage a file without discarding your edits."
  },
  {
    id: "gtg-git-stash",
    session: "git-tf-go",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "git",
    title: "Shelve uncommitted changes onto the Git stash stack",
    prompt: "Temporarily save your uncommitted tracked changes onto the Git stash stack so your working tree is clean.",
    canonical: "git stash",
    accepted: ["git stash", "git stash push"],
    grammar: [
      { token: "git stash", desc: "Stash local modifications and revert working directory to HEAD" }
    ],
    sampleOutput: `Saved working directory and index state WIP on main: 9f81a2c`,
    explanation: "Restore stashed changes later with `git stash pop`."
  },
  {
    id: "gtg-tf-state-list",
    session: "git-tf-go",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "terraform",
    title: "List all resources tracked in the Terraform state file",
    prompt: "List all infrastructure resource addresses currently tracked in Terraform state.",
    canonical: "terraform state list",
    accepted: ["terraform state list"],
    grammar: [
      { token: "terraform state list", desc: "List resource addresses in Terraform state" }
    ],
    sampleOutput: `aws_vpc.main
aws_eks_cluster.prod`,
    explanation: "Inspect a single resource's state attributes with `terraform state show <address>`."
  },
  {
    id: "gtg-go-bench",
    session: "git-tf-go",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "go",
    title: "Run all Go benchmarks in the current package",
    prompt: "Execute all `Benchmark*` functions in the current Go package using `go test`.",
    canonical: "go test -bench=.",
    accepted: ["go test -bench=.", "go test -bench .", "go test -bench=. -benchmem"],
    grammar: [
      { token: "go test -bench=.", desc: "Run all benchmarks matching regex '.'" }
    ],
    sampleOutput: `BenchmarkDecodeEthernet-8   100000000   10.42 ns/op   0 B/op   0 allocs/op`,
    explanation: "Add `-benchmem` to measure heap allocations per operation."
  },
  {
    id: "gtg-git-bisect",
    session: "git-tf-go",
    level: 3,
    difficulty: "Level 3 · Deep Diagnostics",
    tool: "git",
    title: "Start a binary search across Git commits to isolate a regression",
    prompt: "A bug was introduced somewhere in the last 100 commits. Start a `git bisect` session to binary-search the commit history.",
    canonical: "git bisect start",
    accepted: ["git bisect start"],
    grammar: [
      { token: "git bisect start", desc: "Begin binary search across commits (mark current with git bisect bad and known-good SHA with git bisect good)" }
    ],
    sampleOutput: `status: waiting for both good and bad commits`,
    explanation: "Run `git bisect run go test ./...` to automatically find the exact breaking commit."
  },
  {
    id: "gtg-go-pprof",
    session: "git-tf-go",
    level: 3,
    difficulty: "Level 3 · Deep Diagnostics",
    tool: "go",
    title: "Analyze CPU profile file cpu.prof using Go's pprof tool",
    prompt: "Open the profile file `cpu.prof` in Go's built-in profiling tool (`pprof`).",
    canonical: "go tool pprof cpu.prof",
    accepted: ["go tool pprof cpu.prof", "go tool pprof"],
    grammar: [
      { token: "go tool pprof cpu.prof", desc: "Inspect CPU, heap, or goroutine profiles" }
    ],
    sampleOutput: `(pprof) top
1.20s 60.00%  syscall.Syscall6`,
    explanation: "Pinpoints CPU hotspots and memory allocations in Go services."
  },
  {
    id: "gtg-promql-rate",
    session: "git-tf-go",
    level: 3,
    difficulty: "Level 3 · Deep Diagnostics",
    tool: "promql",
    title: "Query the per-second rate of http_requests_total over a 5-minute window",
    prompt: "Write the PromQL expression that calculates the per-second rate of increase of the counter `http_requests_total` over a `5m` range window.",
    canonical: "rate(http_requests_total[5m])",
    accepted: ["rate(http_requests_total[5m])", "sum(rate(http_requests_total[5m]))"],
    grammar: [
      { token: "rate(http_requests_total[5m])", desc: "Per-second rate of increase over a 5-minute window" }
    ],
    sampleOutput: `{job="payment-api", status="200"} => 482.19`,
    explanation: "Always wrap Prometheus Counter metrics in `rate()` or `increase()`."
  },

  // ============================================================================
  // TRACK 9: LEVEL 4 MULTI-STEP PRODUCTION INCIDENT CHAINS
  // ============================================================================
  {
    id: "chain-port-refused",
    session: "cisco-incidents",
    level: 4,
    difficulty: "Level 4 · Incident Chain",
    tool: "ss -> journalctl -> systemctl",
    title: "Incident Chain: Service Connection Refused on Port 8080",
    explanation: "In production debugging, you verify socket bindings (`ss -tulpn`), inspect the service's journal logs (`journalctl -u`), and restart the daemon (`systemctl restart`).",
    steps: [
      {
        prompt: "STEP 1 of 3: External clients get `Connection refused` on TCP port `8080`. First, inspect all listening TCP and UDP sockets with numeric ports and owning processes.",
        canonical: "ss -tulpn",
        accepted: ["ss -tulpn", "lsof -i :8080"],
        output: `Netid State  Recv-Q Send-Q Local Address:Port  Peer Address:Port Process
tcp   LISTEN 0      4096   127.0.0.1:8080      0.0.0.0:*         users:(("envoy",pid=3109,fd=9))`
      },
      {
        prompt: "STEP 2 of 3: Look at the output above—`envoy` is bound to loopback `127.0.0.1:8080` instead of `0.0.0.0:8080`! Stream the live systemd journal logs for the `envoy` unit to see which config file it loaded.",
        canonical: "journalctl -u envoy -f",
        accepted: ["journalctl -u envoy -f", "journalctl -fu envoy", "journalctl -u envoy"],
        output: `Nov 02 22:05:01 node-1 envoy[3109]: loaded listener_address: 127.0.0.1:8080 from /etc/envoy/envoy.yaml`
      },
      {
        prompt: "STEP 3 of 3: You fixed `/etc/envoy/envoy.yaml` to bind `0.0.0.0:8080`. Now restart the `envoy` systemd service.",
        canonical: "systemctl restart envoy",
        accepted: ["systemctl restart envoy", "systemctl restart envoy.service"],
        output: `(envoy.service restarted — now listening on 0.0.0.0:8080 ✅)`
      }
    ],
    grammar: [
      { token: "Step 1: ss -tulpn", desc: "Spot 127.0.0.1 vs 0.0.0.0 socket binding" },
      { token: "Step 2: journalctl -u envoy -f", desc: "Inspect systemd unit logs" },
      { token: "Step 3: systemctl restart envoy", desc: "Restart daemon and verify" }
    ]
  },
  {
    id: "chain-k8s-cilium-drop",
    session: "cisco-incidents",
    level: 4,
    difficulty: "Level 4 · Incident Chain",
    tool: "cilium -> hubble -> kubectl",
    title: "Incident Chain: Kubernetes Pod Timeout & Cilium Policy Drop",
    explanation: "When a Kubernetes microservice times out, verify Cilium health (`cilium status`), inspect dropped flows (`hubble observe --verdict DROPPED`), and confirm Service endpoints (`kubectl get endpoints`).",
    steps: [
      {
        prompt: "STEP 1 of 3: Pod `checkout` is timing out when calling `payments-svc`. First, check overall Cilium CNI health in the cluster.",
        canonical: "cilium status",
        accepted: ["cilium status"],
        output: `Cilium:             OK
Operator:           OK
Hubble Relay:       OK`
      },
      {
        prompt: "STEP 2 of 3: Cilium is healthy. Now use the Hubble CLI to observe only flows whose verdict is `DROPPED`.",
        canonical: "hubble observe --verdict DROPPED",
        accepted: ["hubble observe --verdict DROPPED"],
        output: `Nov  2 22:08:11 default/checkout-5b9d:49120 -> default/payments-8c1a:8443 PolicyVerdict:all EGRESS DROPPED (TCP Flags: SYN)`
      },
      {
        prompt: "STEP 3 of 3: Hubble proved an Egress policy dropped TCP SYN to port 8443! After updating the policy, verify that Service `payments-svc` has healthy backing Pod IPs (`endpoints`).",
        canonical: "kubectl get endpoints payments-svc",
        accepted: ["kubectl get endpoints payments-svc", "kubectl get ep payments-svc"],
        output: `NAME           ENDPOINTS            AGE
payments-svc   10.244.2.80:8443     3d`
      }
    ],
    grammar: [
      { token: "Step 1: cilium status", desc: "Verify CNI agent and Hubble Relay health" },
      { token: "Step 2: hubble observe --verdict DROPPED", desc: "Pinpoint EGRESS vs INGRESS policy drop" },
      { token: "Step 3: kubectl get endpoints payments-svc", desc: "Confirm Ready backend Pod IPs" }
    ]
  },
  {
    id: "chain-disk-phantom-leak",
    session: "cisco-incidents",
    level: 4,
    difficulty: "Level 4 · Incident Chain",
    tool: "df -> lsof -> kill",
    title: "Incident Chain: Node Disk 98% Full After Deleting Logs",
    explanation: "When `df -h` still shows a full disk after deleting a huge file, `lsof +L1` identifies the process holding the unlinked file descriptor open.",
    steps: [
      {
        prompt: "STEP 1 of 3: An alert says disk space is critically low. Check mounted filesystem usage in human-readable format.",
        canonical: "df -h",
        accepted: ["df -h", "df -Th"],
        output: `Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p1   50G   49G  1.0G  98% /`
      },
      {
        prompt: "STEP 2 of 3: You deleted `/var/log/huge.log`, yet `/` is still 98% full! Run `lsof` to list open files with a hard link count less than 1 (deleted files).",
        canonical: "lsof +L1",
        accepted: ["lsof +L1", "lsof | grep deleted"],
        output: `COMMAND   PID USER   FD   TYPE DEVICE    SIZE/OFF NLINK NODE NAME
fluentd  4821 root    9w   REG  259,1 42949672960     0 9182 /var/log/huge.log (deleted)`
      },
      {
        prompt: "STEP 3 of 3: PID `4821` (`fluentd`) is still holding the deleted 40GB file open and ignoring SIGTERM. Forcefully terminate PID `4821` with `SIGKILL` (signal 9) to free the disk blocks immediately.",
        canonical: "kill -9 4821",
        accepted: ["kill -9 4821", "kill -KILL 4821"],
        output: `(PID 4821 terminated — 40GB reclaimed immediately on /dev/nvme0n1p1 ✅)`
      }
    ],
    grammar: [
      { token: "Step 1: df -h", desc: "Confirm block-level filesystem saturation" },
      { token: "Step 2: lsof +L1", desc: "Locate unlinked open file descriptors" },
      { token: "Step 3: kill -9 4821", desc: "Release open FDs so the kernel frees the blocks" }
    ]
  },

  // ============================================================================
  // ADDITIONAL MULTI-VARIATION DRILLS ACROSS ALL TRACKS (LEVELS 1–4)
  // ============================================================================
  {
    id: "net-tcpdump-read-pcap",
    session: "linux-net",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "tcpdump",
    title: "Read and decode packets from an existing capture.pcap file with numeric output",
    prompt: "A colleague captured traffic into `capture.pcap` during an outage. Read and print the packets from `capture.pcap` using `tcpdump` without resolving hostnames or port names.",
    canonical: "tcpdump -nn -r capture.pcap",
    accepted: ["tcpdump -nn -r capture.pcap", "tcpdump -r capture.pcap -nn", "tcpdump -n -r capture.pcap", "tcpdump -r capture.pcap"],
    grammar: [
      { token: "-r capture.pcap", desc: "Read packets from saved pcap file instead of a live interface" },
      { token: "-nn", desc: "Do not resolve host IPs or port numbers" }
    ],
    sampleOutput: `reading from file capture.pcap, link-type EN10MB (Ethernet)
18:25:01.402 IP 10.244.1.15.51244 > 10.244.2.80.80: Flags [S]`,
    explanation: "`-w` writes raw packets to a file; `-r` reads them back and lets you apply BPF filters offline (e.g. `tcpdump -nn -r capture.pcap port 53`)."
  },
  {
    id: "net-tcpdump-ascii",
    session: "linux-net",
    level: 3,
    difficulty: "Level 3 · Deep Diagnostics",
    tool: "tcpdump",
    title: "Capture HTTP traffic on eth0 port 80 and print packet payloads in ASCII",
    prompt: "Capture traffic on `eth0` for `port 80` with numeric IPs/ports and print each packet's payload in ASCII so you can read raw HTTP headers on the wire.",
    canonical: "tcpdump -i eth0 -nn -A port 80",
    accepted: ["tcpdump -i eth0 -nn -A port 80", "tcpdump -i eth0 -nnA port 80", "tcpdump -nn -A -i eth0 port 80"],
    grammar: [
      { token: "-A", desc: "Print each packet (minus link header) in ASCII text" },
      { token: "-nn", desc: "Numeric IPs and port numbers" }
    ],
    sampleOutput: `GET /healthz HTTP/1.1
Host: 10.244.2.80:8080
User-Agent: kube-probe/1.31`,
    explanation: "`-A` prints ASCII text; use `-X` when you want a side-by-side hex + ASCII dump of binary protocols."
  },
  {
    id: "net-ip-netns-list",
    session: "linux-net",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "ip",
    title: "List all named Linux network namespaces on the host",
    prompt: "Display all named network namespaces registered under `/var/run/netns` using `ip`.",
    canonical: "ip netns list",
    accepted: ["ip netns list", "ip netns", "ip netns show"],
    grammar: [
      { token: "ip netns list", desc: "List all named network namespaces on the system" }
    ],
    sampleOutput: `cni-8a41b2c1-9012-4d1e (id: 2)
cni-3f19e0a2-1184-4b2c (id: 1)`,
    explanation: "CNI plugins create a separate network namespace per Kubernetes Pod."
  },
  {
    id: "net-ip-netns-exec",
    session: "linux-net",
    level: 3,
    difficulty: "Level 3 · Deep Diagnostics",
    tool: "ip",
    title: "Execute ip addr inside named network namespace 'pod-ns'",
    prompt: "Run `ip addr` inside the named Linux network namespace `pod-ns` using `ip netns exec`.",
    canonical: "ip netns exec pod-ns ip addr",
    accepted: ["ip netns exec pod-ns ip addr", "ip netns exec pod-ns ip a", "ip -n pod-ns addr"],
    grammar: [
      { token: "ip netns exec pod-ns", desc: "Switch into network namespace 'pod-ns' and run the following command" },
      { token: "ip addr", desc: "Command executed inside 'pod-ns'" }
    ],
    sampleOutput: `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536
2: eth0@if19: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500
    inet 10.244.1.48/32 scope global eth0`,
    explanation: "Tip: `ip -n pod-ns addr` is a built-in shorthand for `ip netns exec pod-ns ip addr`."
  },
  {
    id: "net-ss-summary",
    session: "linux-net",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "ss",
    title: "Print a summary count of total, TCP established, time-wait, and orphaned sockets",
    prompt: "A load balancer is handling 50,000 connections. Print a high-level summary of socket counts by protocol and state (rather than listing 50,000 individual lines) using `ss`.",
    canonical: "ss -s",
    accepted: ["ss -s", "ss --summary"],
    grammar: [
      { token: "ss -s", desc: "Print summary statistics of all kernel sockets (Total, TCP estab, closed, orphaned, timewait)" }
    ],
    sampleOutput: `Total: 14820
TCP:   12410 (estab 8910, closed 3200, orphaned 12, timewait 3180)`,
    explanation: "On a node with tens of thousands of sockets, `ss -s` reads kernel summary counters instantaneously."
  },
  {
    id: "net-ethtool-offload",
    session: "linux-net",
    level: 3,
    difficulty: "Level 3 · Deep Diagnostics",
    tool: "ethtool",
    title: "Inspect NIC hardware offload features (TSO, GSO, GRO, rx-checksumming) on eth0",
    prompt: "Your Go `AF_PACKET` sniffer is seeing 64KB jumbo TCP segments on a 1500-MTU interface because Generic Receive Offload (GRO) is coalescing packets in the NIC driver. Inspect the offload feature flags of `eth0` using `ethtool`.",
    canonical: "ethtool -k eth0",
    accepted: ["ethtool -k eth0", "ethtool --show-features eth0"],
    grammar: [
      { token: "ethtool -k eth0", desc: "Show state of protocol offload and other NIC features (TSO, GSO, GRO, LRO, VLAN hw accel)" }
    ],
    sampleOutput: `tcp-segmentation-offload: on
generic-segmentation-offload: on
generic-receive-offload: on
rx-vlan-offload: on`,
    explanation: "When GRO/TSO is `on`, `tcpdump` and `AF_PACKET` sockets see super-sized merged frames (up to 64KB) before the NIC splits them on wire into 1500B MTU packets!"
  },
  {
    id: "net-curl-resolve",
    session: "linux-net",
    level: 3,
    difficulty: "Level 3 · Deep Diagnostics",
    tool: "curl",
    title: "Test an HTTPS endpoint against a specific backend IP (10.244.1.48) with TLS SNI",
    prompt: "You want to test TLS certificate and HTTP routing on pod IP `10.244.1.48` port `443` for hostname `api.example.com` without changing `/etc/hosts` or DNS. Use `curl` with `--resolve`.",
    canonical: "curl --resolve api.example.com:443:10.244.1.48 https://api.example.com",
    accepted: [
      "curl --resolve api.example.com:443:10.244.1.48 https://api.example.com",
      "curl -v --resolve api.example.com:443:10.244.1.48 https://api.example.com"
    ],
    grammar: [
      { token: "--resolve <host:port:ip>", desc: "Force curl to connect to <ip> while sending <host> in both TLS SNI and the HTTP Host header" }
    ],
    sampleOutput: `* Added api.example.com:443:10.244.1.48 to DNS cache
* Connected to api.example.com (10.244.1.48) port 443`,
    explanation: "Simply running `curl -H 'Host: api.example.com' https://10.244.1.48` fails TLS verification because TLS SNI uses the URL hostname, not the HTTP `Host` header. `--resolve` sets both!"
  },
  {
    id: "proc-vmstat",
    session: "linux-proc",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "vmstat",
    title: "Sample virtual memory, swap, context switches, and CPU wait every 1 second",
    prompt: "Run `vmstat` with a `1`-second sampling interval to watch runnable threads (`r`), blocked I/O threads (`b`), swap-in/out (`si`/`so`), and context switches (`cs`).",
    canonical: "vmstat 1",
    accepted: ["vmstat 1", "vmstat 1 5"],
    grammar: [
      { token: "vmstat 1", desc: "Report virtual memory, process, interrupt, and CPU statistics every 1 second" }
    ],
    sampleOutput: `procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
 4  0      0 941200 124800 841200    0    0     0    42 4120 8910 18  6 76  0  0`,
    explanation: "Non-zero `si`/`so` columns in `vmstat 1` prove the kernel is actively thrashing swap space right now."
  },
  {
    id: "proc-cap-status",
    session: "linux-proc",
    level: 3,
    difficulty: "Level 3 · Deep Diagnostics",
    tool: "grep / proc",
    title: "Check Linux capabilities (CapEff) of process 4102 in /proc",
    prompt: "Your Go `AF_PACKET` sniffer (PID `4102`) failed with `operation not permitted`. Search `/proc/4102/status` for `Cap` using `grep` to inspect its effective Linux capability bitmask (`CapEff`).",
    canonical: "grep Cap /proc/4102/status",
    accepted: ["grep Cap /proc/4102/status", "grep -i cap /proc/4102/status"],
    grammar: [
      { token: "grep Cap /proc/4102/status", desc: "Print CapInh, CapPrm, CapEff, CapBnd, and CapAmb bitmasks for PID 4102" }
    ],
    sampleOutput: `CapInh:	0000000000000000
CapPrm:	0000000000003000
CapEff:	0000000000003000`,
    explanation: "Bit `13` (`0x2000`) is `CAP_NET_RAW` (required for `AF_PACKET` and ICMP raw sockets) and bit `12` (`0x1000`) is `CAP_NET_ADMIN`—so `0000000000003000` confirms both capabilities are active! Decode any hex mask with `capsh --decode=0000000000003000`."
  },
  {
    id: "sys-journalctl-prev-boot",
    session: "systemd-logs",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "journalctl",
    title: "Inspect systemd journal logs from the previous boot after a node crash",
    prompt: "A bare-metal server rebooted unexpectedly overnight. Query `journalctl` for the logs from the **previous boot** (`-b -1`).",
    canonical: "journalctl -b -1",
    accepted: ["journalctl -b -1", "journalctl -b-1"],
    grammar: [
      { token: "journalctl -b -1", desc: "Show journal logs from the boot session immediately preceding the current boot (-1)" }
    ],
    sampleOutput: `Nov 02 03:14:09 node-1 kernel: Kernel panic - not syncing: Fatal exception in interrupt`,
    explanation: "When persistent journal storage (`/var/log/journal`) is enabled, `journalctl -b -1` shows what happened right before the crash/reboot."
  },
  {
    id: "sys-journalctl-vacuum",
    session: "systemd-logs",
    level: 3,
    difficulty: "Level 3 · Deep Diagnostics",
    tool: "journalctl",
    title: "Shrink systemd journal disk usage down to 1 Gigabyte",
    prompt: "`/var/log/journal` is consuming 8GB of disk space on a worker node. Use `journalctl` with `--vacuum-size` to trim archived journal files down to `1G`.",
    canonical: "journalctl --vacuum-size=1G",
    accepted: ["journalctl --vacuum-size=1G", "journalctl --vacuum-size 1G"],
    grammar: [
      { token: "journalctl --vacuum-size=1G", desc: "Remove oldest archived journal files until total journal size is under 1 GiB" }
    ],
    sampleOutput: `Vacuuming done, freed 6.8G of archived journals from /var/log/journal.`,
    explanation: "Safe way to reclaim gigabytes of `/var/log/journal` space during a node `DiskPressure` incident without corrupting active journal files."
  },
  {
    id: "k8s-logs-container",
    session: "kubectl",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "kubectl",
    title: "Fetch logs from a specific sidecar container ('envoy') inside a multi-container Pod",
    prompt: "Pod `payment-api` contains two containers: `app` and `envoy`. Fetch the logs specifically for the `envoy` container.",
    canonical: "kubectl logs payment-api -c envoy",
    accepted: ["kubectl logs payment-api -c envoy", "kubectl logs -c envoy payment-api"],
    grammar: [
      { token: "-c envoy", desc: "Select container 'envoy' inside a multi-container pod" }
    ],
    sampleOutput: `[2026-11-02 22:20:01.104][18][info][main]lds: add/update listener '0.0.0.0_8080'`,
    explanation: "Works with `kubectl exec -it payment-api -c envoy -- sh` as well."
  },
  {
    id: "k8s-auth-can-i",
    session: "kubectl",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "kubectl",
    title: "Verify RBAC permissions using kubectl auth can-i",
    prompt: "A CI pipeline or ServiceAccount is getting `403 Forbidden`. Use `kubectl auth can-i` to check whether your current identity is allowed to `create deployments`.",
    canonical: "kubectl auth can-i create deployments",
    accepted: ["kubectl auth can-i create deployments", "kubectl auth can-i create deployment", "kubectl auth can-i create deploy"],
    grammar: [
      { token: "kubectl auth can-i <verb> <resource>", desc: "Query Kubernetes SubjectAccessReview API to test RBAC permissions" }
    ],
    sampleOutput: `yes`,
    explanation: "Add `--as=system:serviceaccount:default:my-sa` to test RBAC permissions of a specific Pod's ServiceAccount!"
  },
  {
    id: "k8s-get-netpol",
    session: "kubectl",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "kubectl",
    title: "List all NetworkPolicies across all namespaces",
    prompt: "List all Kubernetes `NetworkPolicy` (`netpol`) resources across all namespaces.",
    canonical: "kubectl get netpol -A",
    accepted: [
      "kubectl get netpol -A",
      "kubectl get networkpolicies -A",
      "kubectl get networkpolicy -A"
    ],
    grammar: [
      { token: "kubectl get netpol -A", desc: "List NetworkPolicy resources across all namespaces" }
    ],
    sampleOutput: `NAMESPACE   NAME                 POD-SELECTOR     AGE
default     deny-egress-all      app=checkout     2h`,
    explanation: "In Cilium clusters, also check `kubectl get cnp,ccnp -A` for `CiliumNetworkPolicy` and `CiliumClusterwideNetworkPolicy` CRDs!"
  },
  {
    id: "k8s-jsonpath-ips",
    session: "kubectl",
    level: 3,
    difficulty: "Level 3 · Deep Diagnostics",
    tool: "kubectl",
    title: "Extract InternalIP of all cluster nodes using JSONPath",
    prompt: "Get nodes using `kubectl` and extract `.items[*].status.addresses[0].address` via `-o jsonpath`.",
    canonical: "kubectl get nodes -o jsonpath='{.items[*].status.addresses[0].address}'",
    accepted: [
      "kubectl get nodes -o jsonpath='{.items[*].status.addresses[0].address}'",
      "kubectl get no -o jsonpath='{.items[*].status.addresses[0].address}'"
    ],
    grammar: [
      { token: "-o jsonpath='{...}'", desc: "Extract specific fields from Kubernetes API JSON responses" }
    ],
    sampleOutput: `172.18.0.2 172.18.0.3 172.18.0.4`,
    explanation: "JSONPath extraction is heavily tested in CKA/CKS and SRE scripting interviews."
  },
  {
    id: "hc-cilium-endpoint-list",
    session: "helm-cilium",
    level: 2,
    difficulty: "Level 2 · Filtering & Flags",
    tool: "cilium",
    title: "List all Cilium endpoints, security identities, and policy enforcement states on a node",
    prompt: "Inside a Cilium agent pod, list all managed local endpoints (`endpoint list`) to see their security identity IDs, IPv4 addresses, and ingress/egress policy enforcement status.",
    canonical: "cilium endpoint list",
    accepted: ["cilium endpoint list", "cilium-dbg endpoint list"],
    grammar: [
      { token: "cilium endpoint list", desc: "List local Cilium endpoints, security identities, and policy status (Enabled/Disabled)" }
    ],
    sampleOutput: `ENDPOINT   POLICY (ingress)   POLICY (egress)   IDENTITY   LABELS (source:key[=value])   IPv4          STATUS
1042       Enabled            Enabled           41892      k8s:app=checkout              10.244.1.15   ready`,
    explanation: "Cilium enforces network policy using numeric **Security Identities** (`IDENTITY 41892`) derived from Pod labels rather than brittle IP addresses."
  },
  {
    id: "chain-l2-sniffer-debug",
    session: "cisco-incidents",
    level: 4,
    difficulty: "Level 4 · Incident Chain",
    tool: "ip -> tcpdump -> ethtool",
    title: "Incident Chain: Go AF_PACKET Sniffer Missing VLAN & Jumbo Frames",
    explanation: "When building or debugging a Layer 2 packet sniffer on Linux, verify interface state (`ip link`), enable promiscuous mode (`ip link set eth0 promisc on`), and inspect L2 VLAN headers (`tcpdump -i eth0 -nn -e`).",
    steps: [
      {
        prompt: "STEP 1 of 3: Your Go `AF_PACKET` sniffer on `eth0` only sees broadcast and host-destined frames, missing other traffic on the mirror port. First, enable promiscuous mode (`promisc on`) on `eth0` using `ip link set`.",
        canonical: "ip link set eth0 promisc on",
        accepted: ["ip link set eth0 promisc on", "ip link set dev eth0 promisc on"],
        output: `(eth0 flags updated: <BROADCAST,MULTICAST,PROMISC,UP,LOWER_UP>)`
      },
      {
        prompt: "STEP 2 of 3: Now verify whether incoming frames on `eth0` carry 802.1Q VLAN tags by running `tcpdump` on `eth0` with numeric output and Layer 2 link-level Ethernet headers enabled.",
        canonical: "tcpdump -i eth0 -nn -e",
        accepted: ["tcpdump -i eth0 -nn -e", "tcpdump -i eth0 -nne", "tcpdump -nne -i eth0"],
        output: `22:40:01.104 00:1b:54:c2:10:01 > 52:54:00:6b:3c:11, ethertype 802.1Q (0x8100), vlan 200, ethertype IPv4`
      },
      {
        prompt: "STEP 3 of 3: You also notice your sniffer receives 64KB coalesced TCP packets on a 1500-MTU link! Inspect the NIC hardware offload flags (GRO/TSO/rx-vlan-offload) on `eth0` using `ethtool`.",
        canonical: "ethtool -k eth0",
        accepted: ["ethtool -k eth0", "ethtool --show-features eth0"],
        output: `generic-receive-offload: on
tcp-segmentation-offload: on
rx-vlan-offload: on (Confirmed: GRO is merging packets and rx-vlan-offload strips 802.1Q tags into skb metadata ✅)`
      }
    ],
    grammar: [
      { token: "Step 1: ip link set eth0 promisc on", desc: "Disable NIC hardware MAC filter so all L2 frames reach AF_PACKET" },
      { token: "Step 2: tcpdump -i eth0 -nn -e", desc: "Inspect L2 MACs and 802.1Q EtherType (0x8100)" },
      { token: "Step 3: ethtool -k eth0", desc: "Verify GRO/GSO/TSO and hardware VLAN offload state" }
    ]
  }
];

