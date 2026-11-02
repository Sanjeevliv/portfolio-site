// Comprehensive SRE / Cisco / Systems Engineering CLI Mastery Curriculum
// Includes Single-Command Drills, "Read the Symptom Output" Diagnostics, and Multi-Step Incident Chains

window.SRE_LAB_SESSIONS = [
  { id: "all", title: "All Topics (Smart Mix)" },
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
  // 1. LINUX FILES, TEXT & PERMISSIONS
  // ============================================================================
  {
    id: "lnx-ls-lah",
    session: "linux-files",
    difficulty: "Core",
    tool: "ls",
    title: "List all files including hidden dotfiles with human-readable sizes",
    prompt: "List all files in the current directory—including hidden dotfiles (`.` and `.env`)—in long format (`-l`) with human-readable sizes (`-h`).",
    hint: "Combine `-l`, `-a`, and `-h` with `ls`.",
    canonical: "ls -lah",
    accepted: ["ls -lah", "ls -l -a -h"],
    grammar: [
      { token: "ls", desc: "List directory contents" },
      { token: "-l", desc: "Long format (permissions, owner, size, timestamp)" },
      { token: "-a", desc: "Include hidden dotfiles starting with '.'" },
      { token: "-h", desc: "Human-readable sizes (K, M, G)" }
    ],
    sampleOutput: `drwxr-xr-x  6 sanjeev staff 192B Nov  2 18:10 .
-rw-------  1 sanjeev staff 1.4K Nov  2 17:45 .env
-rwxr-xr-x  1 sanjeev staff 8.2M Nov  2 18:09 frametap`,
    explanation: "Checking permissions (`-rwxr-xr-x`), ownership, and hidden `.env` or `.kube` files is the first step in any unfamiliar directory."
  },
  {
    id: "lnx-ls-lt",
    session: "linux-files",
    difficulty: "Core",
    tool: "ls",
    title: "List files sorted by most recently modified first",
    prompt: "List files in `/var/log` in long format (`-l`) sorted by modification time (`-t`, newest first) with human-readable sizes (`-h`).",
    hint: "Use `ls -lth /var/log`.",
    canonical: "ls -lth /var/log",
    accepted: ["ls -lth /var/log", "ls -lt /var/log", "ls -lth /var/log/"],
    grammar: [
      { token: "ls -l", desc: "Long listing format" },
      { token: "-t", desc: "Sort by modification time, newest first" },
      { token: "-h", desc: "Human-readable file sizes" }
    ],
    sampleOutput: `-rw-r----- 1 syslog adm 4.2M Nov  2 21:59 syslog
-rw-r----- 1 syslog adm 1.8M Nov  2 21:58 kern.log`,
    explanation: "`ls -lth` immediately shows which log file was written to most recently during an active incident."
  },
  {
    id: "lnx-pwd",
    session: "linux-files",
    difficulty: "Core",
    tool: "pwd",
    title: "Print the current working directory path",
    prompt: "Print the full absolute path of your current working directory.",
    hint: "Use `pwd`.",
    canonical: "pwd",
    accepted: ["pwd", "pwd -P"],
    grammar: [
      { token: "pwd", desc: "Print working directory" },
      { token: "-P", desc: "(Optional) Resolve symlinks to physical path" }
    ],
    sampleOutput: `/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs`,
    explanation: "Use `pwd -P` when debugging symlinked release directories to see the real physical path on disk."
  },
  {
    id: "lnx-find-logs",
    session: "linux-files",
    difficulty: "Core",
    tool: "find",
    title: "Find all .log files inside /var/log",
    prompt: "Search recursively inside `/var/log` for regular files (`-type f`) whose name ends with `.log` (`-name \"*.log\"`).",
    hint: "Use `find /var/log -type f -name \"*.log\"`.",
    canonical: "find /var/log -type f -name \"*.log\"",
    accepted: [
      "find /var/log -type f -name \"*.log\"",
      "find /var/log -name \"*.log\" -type f",
      "find /var/log -name *.log"
    ],
    grammar: [
      { token: "find /var/log", desc: "Recursively search /var/log" },
      { token: "-type f", desc: "Match only regular files" },
      { token: "-name \"*.log\"", desc: "Match filenames ending in .log" }
    ],
    sampleOutput: `/var/log/kern.log
/var/log/nginx/error.log`,
    explanation: "Always quote glob patterns (`\"*.log\"`) so the shell doesn't expand `*` before invoking `find`."
  },
  {
    id: "lnx-find-large",
    session: "linux-files",
    difficulty: "Intermediate",
    tool: "find",
    title: "Find files larger than 100 Megabytes across /var",
    prompt: "A disk usage alert fired. Find all regular files (`-type f`) under `/var` strictly larger than 100 Megabytes (`-size +100M`).",
    hint: "Use `find /var -type f -size +100M`.",
    canonical: "find /var -type f -size +100M",
    accepted: [
      "find /var -type f -size +100M",
      "find /var -size +100M -type f",
      "find /var -size +100M"
    ],
    grammar: [
      { token: "find /var", desc: "Search directory tree /var" },
      { token: "-type f", desc: "Regular files only" },
      { token: "-size +100M", desc: "Strictly greater than 100 MiB" }
    ],
    sampleOutput: `/var/log/journal/a8b1c3/system.journal
/var/lib/docker/containers/9f8e1a/9f8e1a-json.log`,
    explanation: "Unrotated container JSON logs or systemd journals under `/var` are a top cause of Kubernetes node `DiskPressure`."
  },
  {
    id: "lnx-find-mtime",
    session: "linux-files",
    difficulty: "Intermediate",
    tool: "find",
    title: "Find configuration files modified in the last 24 hours",
    prompt: "Something changed on the host today and broke networking. Find all regular files (`-type f`) inside `/etc` modified within the last 1 day (`-mtime -1`).",
    hint: "Use `find /etc -type f -mtime -1`.",
    canonical: "find /etc -type f -mtime -1",
    accepted: ["find /etc -type f -mtime -1", "find /etc -mtime -1 -type f", "find /etc -mtime -1"],
    grammar: [
      { token: "find /etc", desc: "Search under /etc" },
      { token: "-type f", desc: "Regular files only" },
      { token: "-mtime -1", desc: "Modified less than 24 hours ago (use -mmin -60 for last 60 minutes)" }
    ],
    sampleOutput: `/etc/sysctl.d/99-kubernetes-cri.conf
/etc/cni/net.d/05-cilium.conflist`,
    explanation: "When a server suddenly misbehaves and nobody admits to changing config, `find /etc -type f -mtime -1` (or `-mmin -30`) catches recent edits immediately."
  },
  {
    id: "lnx-grep-error",
    session: "linux-files",
    difficulty: "Core",
    tool: "grep",
    title: "Search recursively and case-insensitively for 'error' with line numbers",
    prompt: "Search recursively (`-r`) and case-insensitively (`-i`) with line numbers (`-n`) for `error` inside `/var/log/nginx`.",
    hint: "Combine `-r`, `-i`, and `-n` with `grep`.",
    canonical: "grep -rin \"error\" /var/log/nginx",
    accepted: ["grep -rin \"error\" /var/log/nginx", "grep -rin error /var/log/nginx"],
    grammar: [
      { token: "grep", desc: "Search text patterns" },
      { token: "-r", desc: "Recursive directory traversal" },
      { token: "-i", desc: "Case-insensitive match" },
      { token: "-n", desc: "Print 1-based line numbers" }
    ],
    sampleOutput: `/var/log/nginx/error.log:42:2026/11/02 [error] connect() failed (111: Connection refused)`,
    explanation: "`grep -rin` is the go-to flag combination for hunting errors or config keys across a directory tree."
  },
  {
    id: "lnx-grep-invert",
    session: "linux-files",
    difficulty: "Core",
    tool: "grep",
    title: "Filter out comments and empty lines from a config file using grep",
    prompt: "Use extended regex (`-E`) and invert-match (`-v`) with `grep` to print all lines in `/etc/ssh/sshd_config` that do NOT match `'^(#|$)'` (comments or blank lines).",
    hint: "Use `grep -Ev '^(#|$)' /etc/ssh/sshd_config`.",
    canonical: "grep -Ev '^(#|$)' /etc/ssh/sshd_config",
    accepted: [
      "grep -Ev '^(#|$)' /etc/ssh/sshd_config",
      "grep -vE '^(#|$)' /etc/ssh/sshd_config",
      "grep -v '^#' /etc/ssh/sshd_config"
    ],
    grammar: [
      { token: "-E", desc: "Extended regular expressions (enables | and grouping without backslashes)" },
      { token: "-v", desc: "Invert match: select non-matching lines" },
      { token: "'^(#|$)'", desc: "Match lines starting with # or empty lines" }
    ],
    sampleOutput: `Port 22
PermitRootLogin no
PubkeyAuthentication yes`,
    explanation: "`grep -Ev '^(#|$)' <file>` strips 500 lines of boilerplate comments down to the 10 active directives."
  },
  {
    id: "lnx-sed-replace",
    session: "linux-files",
    difficulty: "Intermediate",
    tool: "sed",
    title: "Replace all occurrences of a string in-place using sed",
    prompt: "Update `config.yaml` in-place (`-i`) by replacing every occurrence (`g`) of `localhost` with `10.96.0.1`.",
    hint: "Use `sed -i 's/localhost/10.96.0.1/g' config.yaml`.",
    canonical: "sed -i 's/localhost/10.96.0.1/g' config.yaml",
    accepted: ["sed -i 's/localhost/10.96.0.1/g' config.yaml"],
    grammar: [
      { token: "sed -i", desc: "Edit file in-place (GNU sed)" },
      { token: "'s/localhost/10.96.0.1/g'", desc: "Substitute (s) globally (g) on each line" }
    ],
    sampleOutput: `(config.yaml updated in-place)`,
    explanation: "Without the trailing `g` flag, `sed` only replaces the first match on each line."
  },
  {
    id: "lnx-awk-columns",
    session: "linux-files",
    difficulty: "Core",
    tool: "awk",
    title: "Extract the 1st and 9th whitespace-separated columns from access.log",
    prompt: "Use `awk` to print column `$1` (client IP) and column `$9` (HTTP status code) from `access.log`.",
    hint: "Use `awk '{print $1, $9}' access.log`.",
    canonical: "awk '{print $1, $9}' access.log",
    accepted: ["awk '{print $1, $9}' access.log", "awk '{ print $1, $9 }' access.log"],
    grammar: [
      { token: "awk", desc: "Field-oriented pattern scanning language" },
      { token: "'{print $1, $9}'", desc: "Print 1st and 9th whitespace-delimited fields" }
    ],
    sampleOutput: `10.244.1.18 502
172.16.0.5 200`,
    explanation: "You can also filter rows by condition in `awk`, e.g., `awk '$9 == 502 {print $1}' access.log` to print only client IPs receiving HTTP 502s!"
  },
  {
    id: "lnx-cut-passwd",
    session: "linux-files",
    difficulty: "Core",
    tool: "cut",
    title: "Extract usernames and login shells from /etc/passwd",
    prompt: "Use `cut` with delimiter `:` (`-d:`) to extract fields 1 and 7 (`-f1,7`) from `/etc/passwd`.",
    hint: "Use `cut -d: -f1,7 /etc/passwd`.",
    canonical: "cut -d: -f1,7 /etc/passwd",
    accepted: ["cut -d: -f1,7 /etc/passwd", "cut -d ':' -f 1,7 /etc/passwd", "cut -f1,7 -d: /etc/passwd"],
    grammar: [
      { token: "cut", desc: "Extract sections from each line" },
      { token: "-d:", desc: "Use ':' as field delimiter" },
      { token: "-f1,7", desc: "Fields 1 (user) and 7 (shell)" }
    ],
    sampleOutput: `root:/bin/bash
sshd:/usr/sbin/nologin`,
    explanation: "`cut` is fast and exact for strictly delimited files like `/etc/passwd` or CSVs."
  },
  {
    id: "lnx-sort-uniq-pipeline",
    session: "linux-files",
    difficulty: "Intermediate",
    tool: "sort / uniq",
    title: "Count and rank unique IP addresses in a file",
    prompt: "Pipe `sort ips.txt` into `uniq -c` and `sort -nr` to count occurrences of each IP and rank them highest-first.",
    hint: "Use `sort ips.txt | uniq -c | sort -nr`.",
    canonical: "sort ips.txt | uniq -c | sort -nr",
    accepted: [
      "sort ips.txt | uniq -c | sort -nr",
      "cat ips.txt | sort | uniq -c | sort -nr"
    ],
    grammar: [
      { token: "sort ips.txt", desc: "Group identical lines together" },
      { token: "uniq -c", desc: "Count adjacent identical lines" },
      { token: "sort -nr", desc: "Sort numerically (-n) in reverse/descending order (-r)" }
    ],
    sampleOutput: `   1482 10.244.2.91
    319 10.244.1.14`,
    explanation: "`uniq` only deduplicates adjacent lines, so you must always `sort` before `uniq -c`."
  },
  {
    id: "lnx-xargs-rm",
    session: "linux-files",
    difficulty: "Intermediate",
    tool: "xargs",
    title: "Safely delete NUL-delimited files found by find using xargs",
    prompt: "Find `.tmp` files in `/tmp` with `-print0` and pipe to `xargs -0 rm -f`.",
    hint: "Use `find /tmp -name \"*.tmp\" -print0 | xargs -0 rm -f`.",
    canonical: "find /tmp -name \"*.tmp\" -print0 | xargs -0 rm -f",
    accepted: [
      "find /tmp -name \"*.tmp\" -print0 | xargs -0 rm -f",
      "find /tmp -type f -name \"*.tmp\" -print0 | xargs -0 rm -f"
    ],
    grammar: [
      { token: "-print0", desc: "Delimit filenames with NUL byte instead of newline" },
      { token: "xargs -0 rm -f", desc: "Read NUL-delimited paths and batch them into rm -f" }
    ],
    sampleOutput: `(Safely deletes hundreds of thousands of .tmp files without 'Argument list too long')`,
    explanation: "Prevents both whitespace-splitting bugs and kernel `E2BIG` (`Argument list too long`) errors."
  },
  {
    id: "lnx-tail-f",
    session: "linux-files",
    difficulty: "Core",
    tool: "tail",
    title: "Follow the last 50 lines of a live log file in real time",
    prompt: "Output the last `50` lines (`-n 50`) of `/var/log/syslog` and follow (`-f`) new lines as they are appended.",
    hint: "Use `tail -n 50 -f /var/log/syslog` (or `tail -f -n 50 /var/log/syslog`).",
    canonical: "tail -n 50 -f /var/log/syslog",
    accepted: [
      "tail -n 50 -f /var/log/syslog",
      "tail -f -n 50 /var/log/syslog",
      "tail -50f /var/log/syslog",
      "tail -fn 50 /var/log/syslog"
    ],
    grammar: [
      { token: "tail", desc: "Output the last part of files" },
      { token: "-n 50", desc: "Show the last 50 lines" },
      { token: "-f", desc: "Follow file descriptor as file grows" }
    ],
    sampleOutput: `Nov  2 22:01:04 node-1 kernel: [84120.11] device veth4a1b entered promiscuous mode`,
    explanation: "Pro tip: `tail -F` (uppercase `-F`) tracks the filename and retries if the log file is rotated (`mv`/`unlink`) by `logrotate`!"
  },
  {
    id: "lnx-chmod-exec",
    session: "linux-files",
    difficulty: "Core",
    tool: "chmod",
    title: "Grant owner read/write/execute and group/others read/execute (0755) on a binary",
    prompt: "Set octal permissions `755` (`rwxr-xr-x`) on the binary `./frametap` so it can be executed.",
    hint: "Use `chmod 755 ./frametap` (or `chmod +x ./frametap`).",
    canonical: "chmod 755 ./frametap",
    accepted: ["chmod 755 ./frametap", "chmod 755 frametap", "chmod +x ./frametap", "chmod +x frametap", "chmod 0755 ./frametap"],
    grammar: [
      { token: "chmod", desc: "Change file mode bits" },
      { token: "755", desc: "Owner=7 (rwx), Group=5 (r-x), Others=5 (r-x)" }
    ],
    sampleOutput: `-rwxr-xr-x 1 sanjeev staff 8.2M Nov  2 18:09 frametap`,
    explanation: "For sensitive SSH keys (`~/.ssh/id_ed25519`), SSH requires `chmod 600` (`rw-------`) and will refuse the key if group/others have read access."
  },
  {
    id: "lnx-tar-extract",
    session: "linux-files",
    difficulty: "Core",
    tool: "tar",
    title: "Extract a .tar.gz archive in the current directory",
    prompt: "Extract (`-x`) the gzip-compressed (`-z`) archive `cilium-linux-amd64.tar.gz` (`-f cilium-linux-amd64.tar.gz`) verbosely (`-v`).",
    hint: "Use `tar -xzvf cilium-linux-amd64.tar.gz`.",
    canonical: "tar -xzvf cilium-linux-amd64.tar.gz",
    accepted: [
      "tar -xzvf cilium-linux-amd64.tar.gz",
      "tar -xvzf cilium-linux-amd64.tar.gz",
      "tar -xzf cilium-linux-amd64.tar.gz",
      "tar xzvf cilium-linux-amd64.tar.gz"
    ],
    grammar: [
      { token: "-x", desc: "Extract files from an archive" },
      { token: "-z", desc: "Filter archive through gzip" },
      { token: "-v", desc: "Verbosely list files processed" },
      { token: "-f <file>", desc: "Use archive file (must come immediately before the filename)" }
    ],
    sampleOutput: `cilium`,
    explanation: "To create a `.tar.gz` archive instead, swap `-x` (extract) with `-c` (create): `tar -czvf logs.tar.gz /var/log/nginx`."
  },

  // ============================================================================
  // 2. LINUX PROCESSES, MEMORY, CPU & /proc
  // ============================================================================
  {
    id: "proc-ps-aux",
    session: "linux-proc",
    difficulty: "Core",
    tool: "ps",
    title: "List all running processes on the system with CPU and memory usage",
    prompt: "Display a snapshot of every running process across all users (`aux`), showing PID, %CPU, %MEM, RSS, STAT, and command.",
    hint: "Use `ps aux`.",
    canonical: "ps aux",
    accepted: ["ps aux", "ps -ef"],
    grammar: [
      { token: "ps", desc: "Report a snapshot of current processes" },
      { token: "aux", desc: "All users (a), user-oriented format (u), include daemons without a tty (x)" }
    ],
    sampleOutput: `USER   PID %CPU %MEM    VSZ   RSS TTY   STAT START TIME COMMAND
root  1184  3.4  2.8 184210 11520 ?     Ssl  Oct29 84:12 /usr/bin/containerd`,
    explanation: "In the `STAT` column: `R` = running, `S` = sleeping, `D` = uninterruptible kernel I/O sleep, `Z` = zombie process."
  },
  {
    id: "proc-ps-sort-mem",
    session: "linux-proc",
    difficulty: "Intermediate",
    tool: "ps",
    title: "List all processes sorted by highest memory consumption first",
    prompt: "A node is running low on RAM. Run `ps aux` sorted in descending order of memory usage (`--sort=-%mem`).",
    hint: "Use `ps aux --sort=-%mem`.",
    canonical: "ps aux --sort=-%mem",
    accepted: ["ps aux --sort=-%mem", "ps aux --sort=-rss"],
    grammar: [
      { token: "ps aux", desc: "List all processes" },
      { token: "--sort=-%mem", desc: "Sort descending (-) by %MEM (or use -%cpu for CPU)" }
    ],
    sampleOutput: `USER   PID %CPU %MEM     VSZ    RSS TTY  STAT START TIME COMMAND
root  4912 42.1 68.4 9841200 541200 ?    Sl   19:02 12:11 /usr/local/bin/prometheus`,
    explanation: "Piping `ps aux --sort=-%mem | head -n 10` gives you the top 9 memory hogs on a server in one non-interactive command."
  },
  {
    id: "proc-top",
    session: "linux-proc",
    difficulty: "Core",
    tool: "top",
    title: "Launch real-time interactive CPU and memory process monitor",
    prompt: "Run the standard real-time interactive process monitor to inspect load averages and CPU states (`us`, `sy`, `wa`, `si`).",
    hint: "Use `top`.",
    canonical: "top",
    accepted: ["top", "htop"],
    grammar: [
      { token: "top", desc: "Real-time process and CPU/memory telemetry viewer" }
    ],
    sampleOutput: `%Cpu(s): 14.2 us,  8.5 sy,  0.0 ni, 74.1 id,  0.2 wa,  0.0 hi,  3.0 si`,
    explanation: "Inside `top`, press `1` to expand individual CPU cores, `P` to sort by CPU, and `M` to sort by Memory."
  },
  {
    id: "proc-free-h",
    session: "linux-proc",
    difficulty: "Core",
    tool: "free",
    title: "Check system RAM, page cache, and swap usage in human-readable units",
    prompt: "Display total, used, free, buff/cache, and available memory in human-readable units (`-h`).",
    hint: "Use `free -h`.",
    canonical: "free -h",
    accepted: ["free -h", "free -m"],
    grammar: [
      { token: "free", desc: "Display amount of free and used system memory" },
      { token: "-h", desc: "Human-readable units (Gi/Mi)" }
    ],
    sampleOutput: `               total   used   free  shared  buff/cache  available
Mem:            15Gi  4.2Gi  400Mi   124Mi        10Gi       10Gi`,
    explanation: "Always check `available` (not `free`), because Linux borrows unused RAM for disk page cache (`buff/cache`) and reclaims it on demand."
  },
  {
    id: "proc-df-h",
    session: "linux-proc",
    difficulty: "Core",
    tool: "df",
    title: "Check mounted filesystem disk space usage",
    prompt: "Display available and used disk space across all mounted filesystems in human-readable format (`-h`).",
    hint: "Use `df -h`.",
    canonical: "df -h",
    accepted: ["df -h", "df -Th"],
    grammar: [
      { token: "df", desc: "Report filesystem disk space usage" },
      { token: "-h", desc: "Human-readable sizes (G, M, K)" }
    ],
    sampleOutput: `Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p1   50G   44G  6.0G  88% /`,
    explanation: "Add `-T` (`df -Th`) to also print the filesystem type (`ext4`, `xfs`, `overlay`, `tmpfs`)."
  },
  {
    id: "proc-df-inodes",
    session: "linux-proc",
    difficulty: "Cisco / SRE Scenario",
    tool: "df",
    title: "Diagnose 'No space left on device' when df -h shows plenty of free gigabytes",
    symptomOutput: `$ touch /var/spool/job.lock
touch: cannot touch '/var/spool/job.lock': No space left on device
$ df -h /
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p1   50G   12G   38G  24% /`,
    prompt: "Look at the symptom output above: `/` has 38GB free, yet creating a file fails with `No space left on device`! Run `df` with the flag that checks **inode** exhaustion.",
    hint: "Pass `-i` (inodes) to `df`.",
    canonical: "df -i",
    accepted: ["df -i", "df -i /", "df -ih"],
    grammar: [
      { token: "df", desc: "Report filesystem usage" },
      { token: "-i", desc: "List inode usage information instead of block usage" }
    ],
    sampleOutput: `Filesystem      Inodes   IUsed  IFree IUse% Mounted on
/dev/nvme0n1p1 3276800 3276800      0  100% /`,
    explanation: "Every file requires 1 inode. Millions of tiny 1-byte cache/session files can exhaust 100% of inodes (`IUse% 100%`) while `df -h` still shows 75% free disk space!"
  },
  {
    id: "proc-du-sh",
    session: "linux-proc",
    difficulty: "Core",
    tool: "du",
    title: "Summarize total disk space used by /var/log",
    prompt: "Calculate the total summary disk usage (`-s`) of `/var/log` in human-readable format (`-h`).",
    hint: "Use `du -sh /var/log`.",
    canonical: "du -sh /var/log",
    accepted: ["du -sh /var/log", "du -sh /var/log/"],
    grammar: [
      { token: "du", desc: "Estimate file space usage" },
      { token: "-s", desc: "Display only a total summary" },
      { token: "-h", desc: "Human-readable units" }
    ],
    sampleOutput: `4.8G	/var/log`,
    explanation: "To see the size of each immediate subdirectory inside `/var/log`, run `du -h --max-depth=1 /var/log`."
  },
  {
    id: "proc-uptime",
    session: "linux-proc",
    difficulty: "Core",
    tool: "uptime",
    title: "Check system uptime and 1/5/15-minute load averages",
    prompt: "Display how long the system has been running and the 1, 5, and 15-minute load averages.",
    hint: "Use `uptime`.",
    canonical: "uptime",
    accepted: ["uptime", "uptime -p"],
    grammar: [
      { token: "uptime", desc: "Display system uptime and load averages" }
    ],
    sampleOutput: ` 18:20:15 up 42 days,  9:11,  2 users,  load average: 0.48, 0.62, 0.55`,
    explanation: "On Linux, load average includes both runnable CPU threads (`R`) and threads blocked in uninterruptible disk/network I/O (`D`)."
  },
  {
    id: "proc-kill-9",
    session: "linux-proc",
    difficulty: "Core",
    tool: "kill",
    title: "Forcefully terminate an unresponsive process (PID 4821) with SIGKILL",
    prompt: "Process `4821` ignored `SIGTERM`. Send `SIGKILL` (`-9`) to terminate PID `4821` immediately.",
    hint: "Use `kill -9 4821`.",
    canonical: "kill -9 4821",
    accepted: ["kill -9 4821", "kill -KILL 4821", "kill -SIGKILL 4821"],
    grammar: [
      { token: "kill", desc: "Send a signal to a process" },
      { token: "-9", desc: "SIGKILL (handled directly by the kernel; cannot be ignored)" },
      { token: "4821", desc: "Target PID" }
    ],
    sampleOutput: `(Process 4821 killed with exit code 137 = 128 + 9)`,
    explanation: "Exit status `137` in Docker/Kubernetes always means `128 + 9 (SIGKILL)`, whereas `143` means `128 + 15 (SIGTERM)`."
  },
  {
    id: "proc-lsof-port",
    session: "linux-proc",
    difficulty: "Core",
    tool: "lsof",
    title: "Find which process has TCP/UDP port 8080 open using lsof",
    prompt: "Use `lsof` to list any process holding open network port `8080` (`-i :8080`).",
    hint: "Use `lsof -i :8080`.",
    canonical: "lsof -i :8080",
    accepted: ["lsof -i :8080", "lsof -i:8080", "lsof -nP -i :8080"],
    grammar: [
      { token: "lsof", desc: "List open file descriptors" },
      { token: "-i :8080", desc: "Match network sockets on port 8080" }
    ],
    sampleOutput: `COMMAND  PID    USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
envoy   3109 sanjeev    9u  IPv4  41892      0t0  TCP *:8080 (LISTEN)`,
    explanation: "Add `-nP` (`lsof -nP -i :8080`) on busy production hosts to skip slow DNS and `/etc/services` port name lookups."
  },
  {
    id: "proc-lsof-deleted",
    session: "linux-proc",
    difficulty: "Cisco / SRE Scenario",
    tool: "lsof",
    title: "Find processes holding open deleted files (phantom disk full)",
    symptomOutput: `$ df -h /var/log
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p2   40G   39G  1.0G  98% /var/log
$ du -sh /var/log
1.2G	/var/log`,
    prompt: "Look at the output above: `df -h` reports 39GB used on `/var/log`, but `du -sh` only finds 1.2GB of visible files! Run `lsof` to find open files whose link count is less than 1 (`+L1`, i.e., deleted files still held open by a process).",
    hint: "Use `lsof +L1`.",
    canonical: "lsof +L1",
    accepted: ["lsof +L1", "lsof | grep deleted"],
    grammar: [
      { token: "lsof", desc: "List open files" },
      { token: "+L1", desc: "Select open files with hard link count < 1 (unlinked from directory tree)" }
    ],
    sampleOutput: `COMMAND  PID USER   FD   TYPE DEVICE    SIZE/OFF NLINK   NODE NAME
java    2048 root    4w   REG  259,2 39812254720     0 131074 /var/log/app.log (deleted)`,
    explanation: "`rm` only unlinks the filename; the kernel cannot reclaim the 38GB of disk blocks until PID 2048 closes FD `4w` (or you truncate it via `: > /proc/2048/fd/4`)."
  },
  {
    id: "proc-strace-pid",
    session: "linux-proc",
    difficulty: "Intermediate",
    tool: "strace",
    title: "Attach strace to a running process to inspect live system calls",
    prompt: "Process `4102` appears hung. Attach `strace` to running PID `4102` (`-p 4102`) to see which kernel system call it is blocked on.",
    hint: "Use `strace -p 4102`.",
    canonical: "strace -p 4102",
    accepted: ["strace -p 4102", "strace -fp 4102", "strace -f -p 4102"],
    grammar: [
      { token: "strace", desc: "Trace system calls and signals" },
      { token: "-p 4102", desc: "Attach to existing process ID 4102 (add -f to also trace child threads/goroutines)" }
    ],
    sampleOutput: `strace: Process 4102 attached
futex(0xc000058148, FUTEX_WAIT_PRIVATE, 0, NULL`,
    explanation: "For multi-threaded programs or Go binaries (which spawn multiple OS threads `M`), pass `-f` (`strace -fp 4102`) to trace all threads, or `-c` (`strace -cp 4102`) for a syscall latency summary table."
  },
  {
    id: "proc-sysctl-forward",
    session: "linux-proc",
    difficulty: "Intermediate",
    tool: "sysctl",
    title: "Enable IPv4 packet forwarding in the Linux kernel at runtime",
    prompt: "Use `sysctl -w` to set the kernel parameter `net.ipv4.ip_forward=1` so the Linux host can route packets between interfaces/pods.",
    hint: "Use `sysctl -w net.ipv4.ip_forward=1`.",
    canonical: "sysctl -w net.ipv4.ip_forward=1",
    accepted: ["sysctl -w net.ipv4.ip_forward=1", "sysctl net.ipv4.ip_forward=1"],
    grammar: [
      { token: "sysctl -w", desc: "Write/modify a kernel runtime parameter under /proc/sys/" },
      { token: "net.ipv4.ip_forward=1", desc: "Maps to /proc/sys/net/ipv4/ip_forward" }
    ],
    sampleOutput: `net.ipv4.ip_forward = 1`,
    explanation: "Kubernetes and Cilium require `net.ipv4.ip_forward=1`. Without it, the Linux kernel drops packets arriving on one interface destined for another subnet."
  },

  // ============================================================================
  // 3. LINUX NETWORKING & PACKET CAPTURE (CISCO / eBPF / AF_PACKET)
  // ============================================================================
  {
    id: "net-ip-addr",
    session: "linux-net",
    difficulty: "Core",
    tool: "ip",
    title: "Inspect IPv4/IPv6 addresses and CIDR masks on all network interfaces",
    prompt: "Use `iproute2` to display all Layer 3 IP addresses assigned to network interfaces.",
    hint: "Use `ip addr` (or `ip a`).",
    canonical: "ip addr",
    accepted: ["ip addr", "ip a", "ip address", "ip addr show", "ip -br addr"],
    grammar: [
      { token: "ip", desc: "iproute2 utility (talks to kernel via Netlink)" },
      { token: "addr", desc: "Inspect Layer 3 IPv4/IPv6 addresses and CIDR prefixes" }
    ],
    sampleOutput: `2: eth0@if14: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 state UP
    inet 172.17.0.2/16 brd 172.17.255.255 scope global eth0`,
    explanation: "Tip: `ip -br -c addr` gives a super clean, colorized 1-line-per-interface table."
  },
  {
    id: "net-ip-link",
    session: "linux-net",
    difficulty: "Core",
    tool: "ip",
    title: "Inspect Layer 2 interface state, MAC addresses, MTU, and PROMISC flags",
    prompt: "Display all Layer 2 network interfaces, their operational state, MTU, and MAC addresses.",
    hint: "Use `ip link`.",
    canonical: "ip link",
    accepted: ["ip link", "ip l", "ip link show", "ip -br link"],
    grammar: [
      { token: "ip link", desc: "Inspect Layer 2 device attributes (MAC, MTU, UP/LOWER_UP, PROMISC)" }
    ],
    sampleOutput: `2: eth0: <BROADCAST,MULTICAST,PROMISC,UP,LOWER_UP> mtu 1500 state UP
    link/ether 52:54:00:6b:3c:11 brd ff:ff:ff:ff:ff:ff`,
    explanation: "`LOWER_UP` means physical Layer 1 carrier link is detected; `UP` means the interface is administratively enabled at Layer 2."
  },
  {
    id: "net-ip-s-link",
    session: "linux-net",
    difficulty: "Intermediate",
    tool: "ip",
    title: "Check RX/TX packet error, drop, and overrun counters on network interfaces",
    prompt: "Use `ip` with the statistics flag (`-s`) on `link` to inspect per-interface RX and TX packet counters, errors, and drops.",
    hint: "Use `ip -s link` (or `ip -s link show eth0`).",
    canonical: "ip -s link",
    accepted: ["ip -s link", "ip -s l", "ip -s link show", "ip -s link show eth0"],
    grammar: [
      { token: "ip -s link", desc: "Print Layer 2 interface RX/TX packet, byte, error, and drop statistics" }
    ],
    sampleOutput: `2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 state UP
    RX:  bytes  packets errors dropped  missed   mcast
    849102410   912401      0    1420       0       0`,
    explanation: "Non-zero `dropped` in `ip -s link` means the kernel softnet backlog or socket buffer dropped incoming frames after the NIC DMA'd them."
  },
  {
    id: "net-ip-promisc",
    session: "linux-net",
    difficulty: "Intermediate",
    tool: "ip",
    title: "Enable promiscuous mode on eth0 for Layer 2 AF_PACKET sniffing",
    prompt: "Your Go `AF_PACKET` packet sniffer needs to capture all frames on the wire, even those not addressed to `eth0`'s MAC. Enable `promisc on` for device `eth0` using `ip link set`.",
    hint: "Use `ip link set eth0 promisc on`.",
    canonical: "ip link set eth0 promisc on",
    accepted: ["ip link set eth0 promisc on", "ip link set dev eth0 promisc on"],
    grammar: [
      { token: "ip link set eth0", desc: "Modify device attributes on eth0" },
      { token: "promisc on", desc: "Enable promiscuous mode so NIC passes all L2 frames to the kernel" }
    ],
    sampleOutput: `(eth0 flags in 'ip link' now include PROMISC)`,
    explanation: "In promiscuous mode (or via `PACKET_ADD_MEMBERSHIP` / `PACKET_MR_PROMISC` `setsockopt` in Go), the NIC disables hardware MAC filtering and passes all frames up to `AF_PACKET` taps."
  },
  {
    id: "net-ip-route",
    session: "linux-net",
    difficulty: "Core",
    tool: "ip",
    title: "Inspect the kernel Layer 3 IP routing table",
    prompt: "Display the main kernel IPv4 routing table.",
    hint: "Use `ip route` (or `ip r`).",
    canonical: "ip route",
    accepted: ["ip route", "ip r", "ip route show"],
    grammar: [
      { token: "ip route", desc: "Display kernel L3 routing table entries" }
    ],
    sampleOutput: `default via 10.0.2.2 dev eth0 proto dhcp src 10.0.2.15 metric 100
10.244.0.0/24 via 10.244.0.0 dev cilium_host src 10.244.0.214 mtu 1500`,
    explanation: "Shows default gateway, local link subnets, and CNI pod CIDR routes."
  },
  {
    id: "net-ip-route-get",
    session: "linux-net",
    difficulty: "Intermediate",
    tool: "ip",
    title: "Query the kernel FIB for the exact route and source IP chosen for a destination",
    prompt: "A host has 5 network interfaces and multiple routing tables. Ask the kernel routing engine which outgoing interface (`dev`), gateway (`via`), and source IP (`src`) it will use to reach `10.244.2.45`.",
    hint: "Use `ip route get 10.244.2.45`.",
    canonical: "ip route get 10.244.2.45",
    accepted: ["ip route get 10.244.2.45", "ip r get 10.244.2.45"],
    grammar: [
      { token: "ip route get", desc: "Perform an actual kernel FIB route lookup for a single destination IP" },
      { token: "10.244.2.45", desc: "Destination IP to resolve" }
    ],
    sampleOutput: `10.244.2.45 via 10.244.0.0 dev cilium_host src 10.244.0.214 uid 0`,
    explanation: "When Cilium or policy-based routing (`ip rule`) uses multiple routing tables, `ip route` only shows the `main` table—whereas `ip route get <ip>` evaluates all rules and prints the exact path the kernel will take!"
  },
  {
    id: "net-ip-neigh",
    session: "linux-net",
    difficulty: "Core",
    tool: "ip",
    title: "Inspect the Layer 2 ARP / neighbor table",
    symptomOutput: `$ ping -c 1 10.0.2.99
From 10.0.2.15 icmp_seq=1 Destination Host Unreachable`,
    prompt: "Pinging `10.0.2.99` on the same `/24` subnet returns `Destination Host Unreachable`. Inspect the kernel ARP / neighbor table to check if ARP resolution for `10.0.2.99` is `INCOMPLETE` or `FAILED`.",
    hint: "Use `ip neigh`.",
    canonical: "ip neigh",
    accepted: ["ip neigh", "ip n", "ip neighbor", "ip neigh show"],
    grammar: [
      { token: "ip neigh", desc: "Show L3-to-L2 ARP/NDISC neighbor cache states (REACHABLE, STALE, INCOMPLETE, FAILED)" }
    ],
    sampleOutput: `10.0.2.2 dev eth0 lladdr 52:55:0a:00:02:02 REACHABLE
10.0.2.99 dev eth0 FAILED`,
    explanation: "When `ping` says `From <your-own-IP>: Destination Host Unreachable`, it means ARP broadcast (`Who has 10.0.2.99?`) received zero ARP replies on the local L2 segment (`ip neigh` shows `FAILED`)."
  },
  {
    id: "net-ss-tulpn",
    session: "linux-net",
    difficulty: "Core",
    tool: "ss",
    title: "List all listening TCP and UDP sockets with numeric ports and process info",
    prompt: "Inspect all listening (`-l`) TCP (`-t`) and UDP (`-u`) sockets with numeric ports (`-n`) and owning process/PID (`-p`).",
    hint: "Use `ss -tulpn`.",
    canonical: "ss -tulpn",
    accepted: ["ss -tulpn"],
    grammar: [
      { token: "ss", desc: "Socket statistics (queries kernel netlink sock_diag)" },
      { token: "-t / -u", desc: "TCP and UDP sockets" },
      { token: "-l", desc: "Listening sockets only" },
      { token: "-p", desc: "Show owning process and PID" },
      { token: "-n", desc: "Numeric addresses and port numbers" }
    ],
    sampleOutput: `Netid State  Recv-Q Send-Q Local Address:Port  Peer Address:Port Process
tcp   LISTEN 0      4096   0.0.0.0:8080        0.0.0.0:*         users:(("api",pid=4102,fd=7))`,
    explanation: "Always check whether `Local Address:Port` is bound to `127.0.0.1` (loopback only) vs `0.0.0.0` / `*` (all interfaces)."
  },
  {
    id: "net-ss-tan",
    session: "linux-net",
    difficulty: "Intermediate",
    tool: "ss",
    title: "Inspect all TCP connection states (ESTABLISHED, TIME-WAIT, SYN-SENT)",
    prompt: "A service is exhausting ephemeral ports. List **all** (`-a`) TCP (`-t`) sockets with numeric ports (`-n`) so you can see `ESTAB`, `TIME-WAIT`, `CLOSE-WAIT`, and `SYN-SENT` connections.",
    hint: "Combine `-t`, `-a`, and `-n` with `ss`: `ss -tan`.",
    canonical: "ss -tan",
    accepted: ["ss -tan", "ss -tanp"],
    grammar: [
      { token: "ss -t", desc: "TCP sockets" },
      { token: "-a", desc: "All socket states (listening + established + time-wait + close-wait)" },
      { token: "-n", desc: "Numeric IPs and ports" }
    ],
    sampleOutput: `State      Recv-Q Send-Q Local Address:Port   Peer Address:Port
ESTAB      0      0      10.244.1.15:8080     10.244.2.19:54120
CLOSE-WAIT 1      0      10.244.1.15:8080     10.244.2.20:39104
SYN-SENT   0      1      10.244.1.15:41892    10.96.4.12:5432`,
    explanation: "Lots of `CLOSE-WAIT` means the remote peer closed the connection (`FIN`), but your local application code forgot to call `conn.Close()`! Lots of `SYN-SENT` means outbound TCP handshakes are being dropped by a firewall or routing blackhole."
  },
  {
    id: "net-nsenter-netns",
    session: "linux-net",
    difficulty: "Cisco / SRE Scenario",
    tool: "nsenter",
    title: "Run ss -tulpn inside a distroless container's network namespace from the host",
    prompt: "A distroless container has no shell or `ss` binary inside it, and its host PID (from `docker inspect` / `crictl inspect`) is `14820`. Use `nsenter` targeting PID `14820` (`-t 14820`) and its network namespace (`-n`) to run `ss -tulpn` using the host's binary!",
    hint: "Use `nsenter -t 14820 -n ss -tulpn`.",
    canonical: "nsenter -t 14820 -n ss -tulpn",
    accepted: ["nsenter -t 14820 -n ss -tulpn", "nsenter -n -t 14820 ss -tulpn"],
    grammar: [
      { token: "nsenter", desc: "Run program with namespaces of another process" },
      { token: "-t 14820", desc: "Target process PID on the host" },
      { token: "-n", desc: "Enter the target process's network namespace (/proc/14820/ns/net)" },
      { token: "ss -tulpn", desc: "Execute the host's ss binary inside the container's netns" }
    ],
    sampleOutput: `Netid State  Recv-Q Send-Q Local Address:Port  Peer Address:Port Process
tcp   LISTEN 0      4096   *:8080              *:*               users:(("app",pid=14820,fd=3))`,
    explanation: "`nsenter -t <PID> -n <cmd>` is a superpower for debugging minimal/distroless Kubernetes pods: you enter the pod's network namespace while keeping access to all root tools (`tcpdump`, `ss`, `ip`, `ethtool`) installed on the worker node!"
  },
  {
    id: "net-ping-count",
    session: "linux-net",
    difficulty: "Core",
    tool: "ping",
    title: "Send 4 ICMP Echo Requests to test Layer 3 reachability",
    prompt: "Send exactly 4 (`-c 4`) ICMP Echo Request packets to `1.1.1.1`.",
    hint: "Use `ping -c 4 1.1.1.1`.",
    canonical: "ping -c 4 1.1.1.1",
    accepted: ["ping -c 4 1.1.1.1", "ping 1.1.1.1 -c 4"],
    grammar: [
      { token: "ping -c 4", desc: "Stop after sending 4 ICMP Echo Request packets" },
      { token: "1.1.1.1", desc: "Destination IP" }
    ],
    sampleOutput: `4 packets transmitted, 4 received, 0% packet loss, time 3005ms`,
    explanation: "Linux `ping` runs indefinitely unless `-c <count>` is specified."
  },
  {
    id: "net-ping-mtu",
    session: "linux-net",
    difficulty: "Cisco / SRE Scenario",
    tool: "ping",
    title: "Diagnose a Path MTU Blackhole with Don't Fragment (DF) probes",
    symptomOutput: `$ curl -v https://10.244.2.10:8443
* Connected to 10.244.2.10 (10.244.2.10) port 8443
* TLSv1.3 (OUT), TLS handshake, Client hello (1):
(hangs forever...)`,
    prompt: "TCP 3-way handshake succeeds, but TLS `ClientHello` hangs! Suspect a VXLAN/Geneve overlay MTU mismatch. Run `ping` to `10.244.2.10` with `-c 4`, Don't Fragment bit set (`-M do`), and payload size `1472` (`-s 1472`).",
    hint: "Use `ping -c 4 -M do -s 1472 10.244.2.10`.",
    canonical: "ping -c 4 -M do -s 1472 10.244.2.10",
    accepted: [
      "ping -c 4 -M do -s 1472 10.244.2.10",
      "ping -M do -s 1472 -c 4 10.244.2.10",
      "ping -M do -s 1472 10.244.2.10"
    ],
    grammar: [
      { token: "-M do", desc: "Set IPv4 Don't Fragment (DF) flag" },
      { token: "-s 1472", desc: "1472 payload + 8B ICMP + 20B IPv4 = 1500B total frame" }
    ],
    sampleOutput: `ping: local error: message too long, mtu=1450`,
    explanation: "When small packets (`ping`, TCP SYN) work but TLS handshakes or bulk transfers hang, it is almost always an MTU blackhole (e.g. 50-byte VXLAN header reducing inner MTU to 1450)."
  },
  {
    id: "net-curl-v",
    session: "linux-net",
    difficulty: "Core",
    tool: "curl",
    title: "Inspect full HTTP request/response headers and TLS handshake with curl",
    prompt: "Make a verbose (`-v`) HTTP request to `https://sanjeevsethi.in`.",
    hint: "Use `curl -v https://sanjeevsethi.in`.",
    canonical: "curl -v https://sanjeevsethi.in",
    accepted: ["curl -v https://sanjeevsethi.in", "curl -v https://sanjeevsethi.in/"],
    grammar: [
      { token: "curl -v", desc: "Print TCP connect, TLS handshake (*), request headers (>), and response headers (<)" }
    ],
    sampleOutput: `* Connected to sanjeevsethi.in (185.199.108.153) port 443
> GET / HTTP/2
< HTTP/2 200`,
    explanation: "Use `curl -I <url>` when you only want response headers (`HEAD` request), or `curl -v --resolve host:443:10.0.0.5 https://host` to test a specific backend IP with SNI."
  },
  {
    id: "net-dig-dns",
    session: "linux-net",
    difficulty: "Core",
    tool: "dig",
    title: "Query DNS records for a Kubernetes service FQDN using dig",
    prompt: "Use `dig` to resolve `kubernetes.default.svc.cluster.local`.",
    hint: "Use `dig kubernetes.default.svc.cluster.local`.",
    canonical: "dig kubernetes.default.svc.cluster.local",
    accepted: [
      "dig kubernetes.default.svc.cluster.local",
      "dig +short kubernetes.default.svc.cluster.local"
    ],
    grammar: [
      { token: "dig", desc: "DNS lookup tool" },
      { token: "+short", desc: "(Optional) Print only the resolved answer" }
    ],
    sampleOutput: `;; ANSWER SECTION:
kubernetes.default.svc.cluster.local. 5 IN A 10.96.0.1`,
    explanation: "To query CoreDNS (`10.96.0.10`) directly bypassing `/etc/resolv.conf`, run `dig @10.96.0.10 kubernetes.default.svc.cluster.local`."
  },
  {
    id: "net-traceroute",
    session: "linux-net",
    difficulty: "Core",
    tool: "traceroute",
    title: "Trace Layer 3 router hops without reverse DNS lookup delays",
    prompt: "Run `traceroute` to `8.8.8.8` with numeric IP output (`-n`).",
    hint: "Use `traceroute -n 8.8.8.8`.",
    canonical: "traceroute -n 8.8.8.8",
    accepted: ["traceroute -n 8.8.8.8", "traceroute 8.8.8.8"],
    grammar: [
      { token: "traceroute -n", desc: "Trace L3 hop path by incrementing IP TTL without reverse DNS lookups" }
    ],
    sampleOutput: ` 1  10.0.2.2  0.412 ms
 2  172.16.0.1  2.104 ms`,
    explanation: "If intermediate firewalls block UDP traceroute probes, use `traceroute -T -p 443 <host>` to send TCP SYN probes on port 443."
  },
  {
    id: "net-tcpdump-port",
    session: "linux-net",
    difficulty: "Core",
    tool: "tcpdump",
    title: "Capture packets on eth0 for port 80 with numeric IPs and ports",
    prompt: "Run `tcpdump` on interface `eth0` (`-i eth0`) with numeric host/port output (`-nn`) filtering for `port 80`.",
    hint: "Use `tcpdump -i eth0 -nn port 80`.",
    canonical: "tcpdump -i eth0 -nn port 80",
    accepted: [
      "tcpdump -i eth0 -nn port 80",
      "tcpdump -nn -i eth0 port 80",
      "tcpdump -i eth0 -n port 80"
    ],
    grammar: [
      { token: "-i eth0", desc: "Capture on interface eth0 (use -i any for all interfaces)" },
      { token: "-nn", desc: "Disable both DNS name resolution and port service-name lookup" },
      { token: "port 80", desc: "BPF filter matching TCP/UDP port 80" }
    ],
    sampleOutput: `18:25:01.402 IP 10.244.1.15.51244 > 10.244.2.80.80: Flags [S], seq 29481041
18:25:01.402 IP 10.244.2.80.80 > 10.244.1.15.51244: Flags [R.], ack 29481042`,
    explanation: "`Flags [S]` (SYN) followed immediately by `Flags [R.]` (RST-ACK) proves the packet reached the destination host, but nothing was listening on port 80."
  },
  {
    id: "net-tcpdump-vlan",
    session: "linux-net",
    difficulty: "Cisco / SRE Scenario",
    tool: "tcpdump",
    title: "Capture packets on eth0 showing Layer 2 Ethernet MACs and 802.1Q VLAN tags",
    prompt: "Run `tcpdump` on `eth0` (`-i eth0`) with numeric output (`-nn`) and link-level Layer 2 Ethernet headers (`-e`) to verify 802.1Q VLAN tags from a Cisco switch trunk.",
    hint: "Add `-e` to `tcpdump -i eth0 -nn`.",
    canonical: "tcpdump -i eth0 -nn -e",
    accepted: ["tcpdump -i eth0 -nn -e", "tcpdump -i eth0 -nne", "tcpdump -nne -i eth0"],
    grammar: [
      { token: "-e", desc: "Print link-level L2 header (src/dst MAC, EtherType 0x8100, VLAN ID)" },
      { token: "-nn", desc: "Numeric IPs and ports" }
    ],
    sampleOutput: `18:42:10.114 00:1b:54:c2:10:01 > 52:54:00:6b:3c:11, ethertype 802.1Q (0x8100), vlan 120, ethertype IPv4`,
    explanation: "Without `-e`, `tcpdump` hides the L2 header and 802.1Q VLAN tag."
  },
  {
    id: "net-tcpdump-write-pcap",
    session: "linux-net",
    difficulty: "Intermediate",
    tool: "tcpdump",
    title: "Write raw captured packets to a .pcap file for Wireshark or Go AF_PACKET replay",
    prompt: "Capture packets on interface `eth0` (`-i eth0`) and write the raw binary packets directly to `capture.pcap` (`-w capture.pcap`).",
    hint: "Use `tcpdump -i eth0 -w capture.pcap`.",
    canonical: "tcpdump -i eth0 -w capture.pcap",
    accepted: ["tcpdump -i eth0 -w capture.pcap", "tcpdump -nn -i eth0 -w capture.pcap"],
    grammar: [
      { token: "-i eth0", desc: "Capture interface" },
      { token: "-w capture.pcap", desc: "Write raw packet bytes to pcap file instead of parsing to stdout" }
    ],
    sampleOutput: `tcpdump: listening on eth0, link-type EN10MB (Ethernet), snapshot length 262144 bytes`,
    explanation: "To read and analyze that `.pcap` file later from the CLI, run `tcpdump -nn -r capture.pcap`."
  },
  {
    id: "net-nc-portcheck",
    session: "linux-net",
    difficulty: "Core",
    tool: "nc",
    title: "Test whether TCP port 443 is open on a remote host using netcat",
    prompt: "Use `nc` in zero-I/O mode (`-z`) with verbose output (`-v`) to test TCP connectivity to `10.96.0.1` port `443`.",
    hint: "Use `nc -zv 10.96.0.1 443`.",
    canonical: "nc -zv 10.96.0.1 443",
    accepted: ["nc -zv 10.96.0.1 443", "nc -vz 10.96.0.1 443"],
    grammar: [
      { token: "nc -zv", desc: "Zero-I/O (-z) verbose (-v) TCP handshake test" },
      { token: "10.96.0.1 443", desc: "Target IP and port" }
    ],
    sampleOutput: `Connection to 10.96.0.1 443 port [tcp/https] succeeded!`,
    explanation: "Fastest way to verify L4 TCP port reachability without sending application payload."
  },
  {
    id: "net-ethtool",
    session: "linux-net",
    difficulty: "Intermediate",
    tool: "ethtool",
    title: "Inspect physical NIC link speed, duplex, and carrier state",
    prompt: "Run `ethtool` on `eth0` to check link speed, duplex, and physical link detection.",
    hint: "Use `ethtool eth0`.",
    canonical: "ethtool eth0",
    accepted: ["ethtool eth0", "ethtool -S eth0"],
    grammar: [
      { token: "ethtool eth0", desc: "Query physical NIC settings (use ethtool -S eth0 for NIC hardware ring-buffer drop counters)" }
    ],
    sampleOutput: `Speed: 25000Mb/s
Duplex: Full
Link detected: yes`,
    explanation: "Use `ethtool -S eth0` to check NIC ring-buffer drops (`rx_missed_errors`) and `ethtool -k eth0` to inspect TSO/GSO/GRO hardware offloads."
  },

  // ============================================================================
  // 4. DOCKER & CONTAINERD (crictl)
  // ============================================================================
  {
    id: "cnt-docker-ps-a",
    session: "containers",
    difficulty: "Core",
    tool: "docker",
    title: "List all Docker containers including stopped/crashed ones",
    prompt: "List all containers on the host—both running and exited (`-a`).",
    hint: "Use `docker ps -a`.",
    canonical: "docker ps -a",
    accepted: ["docker ps -a", "docker ps --all", "docker container ls -a"],
    grammar: [
      { token: "docker ps -a", desc: "List all containers including Exited/Created states" }
    ],
    sampleOutput: `CONTAINER ID   IMAGE          STATUS                     NAMES
c19a04e2b77d   frametap:dev   Exited (1) 2 minutes ago   sniffer-test`,
    explanation: "Stopped or crashed containers only appear when `-a` is passed."
  },
  {
    id: "cnt-docker-images",
    session: "containers",
    difficulty: "Core",
    tool: "docker",
    title: "List locally cached Docker images and their sizes",
    prompt: "List all locally stored Docker images.",
    hint: "Use `docker images`.",
    canonical: "docker images",
    accepted: ["docker images", "docker image ls"],
    grammar: [
      { token: "docker images", desc: "List locally cached container images, tags, and sizes" }
    ],
    sampleOutput: `REPOSITORY   TAG      IMAGE ID       CREATED       SIZE
frametap     latest   4e81d9a02f1b   2 hours ago   18.4MB`,
    explanation: "Use `docker system df` to see total disk space consumed by images, build cache, and volumes."
  },
  {
    id: "cnt-docker-logs",
    session: "containers",
    difficulty: "Core",
    tool: "docker",
    title: "Stream live stdout/stderr logs from a container",
    prompt: "Follow (`-f`) the real-time logs of container `api-gateway`.",
    hint: "Use `docker logs -f api-gateway`.",
    canonical: "docker logs -f api-gateway",
    accepted: ["docker logs -f api-gateway", "docker logs --follow api-gateway"],
    grammar: [
      { token: "docker logs -f", desc: "Stream stdout/stderr logs of a container" }
    ],
    sampleOutput: `2026-11-02T18:30:04Z ERROR upstream timeout dialing tcp 10.96.4.12:5432`,
    explanation: "Pass `--tail 100` (`docker logs -f --tail 100 api-gateway`) to avoid dumping gigabytes of old logs."
  },
  {
    id: "cnt-docker-exec",
    session: "containers",
    difficulty: "Core",
    tool: "docker",
    title: "Open an interactive shell inside a running container",
    prompt: "Run an interactive (`-it`) `sh` shell inside running container `kind-control-plane`.",
    hint: "Use `docker exec -it kind-control-plane sh`.",
    canonical: "docker exec -it kind-control-plane sh",
    accepted: [
      "docker exec -it kind-control-plane sh",
      "docker exec -it kind-control-plane bash",
      "docker exec -ti kind-control-plane sh"
    ],
    grammar: [
      { token: "docker exec -it", desc: "Run interactive (-i) TTY (-t) process inside a container's namespaces" }
    ],
    sampleOutput: `# hostname
kind-control-plane`,
    explanation: "In Kind clusters, `docker exec -it kind-control-plane bash` drops you onto the Kubernetes node itself."
  },
  {
    id: "cnt-docker-inspect",
    session: "containers",
    difficulty: "Core",
    tool: "docker",
    title: "Inspect low-level JSON metadata, host PID, IP, and OOMKilled status of a container",
    prompt: "Dump the low-level JSON metadata of container `api-gateway`.",
    hint: "Use `docker inspect api-gateway`.",
    canonical: "docker inspect api-gateway",
    accepted: ["docker inspect api-gateway", "docker container inspect api-gateway"],
    grammar: [
      { token: "docker inspect", desc: "Return low-level JSON state (State.Pid, State.OOMKilled, NetworkSettings)" }
    ],
    sampleOutput: `"State": { "Status": "running", "Pid": 14820, "OOMKilled": false }`,
    explanation: "`State.Pid` gives you the host PID so you can run `nsenter -t <Pid> -n` from the host."
  },
  {
    id: "cnt-docker-stats",
    session: "containers",
    difficulty: "Core",
    tool: "docker",
    title: "Monitor live CPU, memory, and network I/O across running containers",
    prompt: "Display a live stream of container resource usage statistics.",
    hint: "Use `docker stats`.",
    canonical: "docker stats",
    accepted: ["docker stats", "docker stats --no-stream"],
    grammar: [
      { token: "docker stats", desc: "Stream live cgroup CPU, memory, and I/O metrics for containers" }
    ],
    sampleOutput: `CONTAINER ID   NAME                 CPU %     MEM USAGE / LIMIT     MEM %
8f3d12a9c4b1   kind-control-plane   12.45%    1.42GiB / 7.75GiB     18.32%`,
    explanation: "Reads directly from Linux cgroups (`memory.current`, `cpu.stat`)."
  },
  {
    id: "cnt-docker-network-ls",
    session: "containers",
    difficulty: "Core",
    tool: "docker",
    title: "List all Docker networks",
    prompt: "List all networks managed by the Docker daemon.",
    hint: "Use `docker network ls`.",
    canonical: "docker network ls",
    accepted: ["docker network ls", "docker network list"],
    grammar: [
      { token: "docker network ls", desc: "List Docker networks and their drivers (bridge, host, null)" }
    ],
    sampleOutput: `NETWORK ID     NAME      DRIVER    SCOPE
7c8d9e0f1a2b   kind      bridge    local`,
    explanation: "Follow up with `docker network inspect <name>` to see subnet CIDRs and container IPs."
  },
  {
    id: "cnt-docker-network-inspect",
    session: "containers",
    difficulty: "Core",
    tool: "docker",
    title: "Inspect subnet CIDR, gateway, and attached containers on a Docker network",
    prompt: "Inspect the JSON details of the Docker network named `kind`.",
    hint: "Use `docker network inspect kind`.",
    canonical: "docker network inspect kind",
    accepted: ["docker network inspect kind", "docker network inspect bridge"],
    grammar: [
      { token: "docker network inspect kind", desc: "Show IPAM subnet, gateway, and attached container endpoints" }
    ],
    sampleOutput: `"IPAM": { "Config": [{ "Subnet": "172.18.0.0/16", "Gateway": "172.18.0.1" }] }`,
    explanation: "Reveals the exact bridge IP of every Kind node container."
  },
  {
    id: "cnt-docker-events",
    session: "containers",
    difficulty: "Intermediate",
    tool: "docker",
    title: "Stream real-time lifecycle events (oom, die, start) from the Docker daemon",
    prompt: "Stream real-time events from the Docker daemon.",
    hint: "Use `docker events`.",
    canonical: "docker events",
    accepted: ["docker events", "docker system events"],
    grammar: [
      { token: "docker events", desc: "Stream real-time container/network/volume lifecycle events" }
    ],
    sampleOutput: `2026-11-02T18:34:11Z container oom c19a04e2b77d (name=sniffer-test)
2026-11-02T18:34:11Z container die c19a04e2b77d (exitCode=137)`,
    explanation: "Catches transient crash loops and OOM kills in real time."
  },
  {
    id: "cnt-crictl-ps",
    session: "containers",
    difficulty: "Intermediate",
    tool: "crictl",
    title: "List all containers on a Kubernetes node using containerd's crictl",
    prompt: "On a Kubernetes worker node using `containerd`, list all containers including exited ones (`-a`) via `crictl`.",
    hint: "Use `crictl ps -a`.",
    canonical: "crictl ps -a",
    accepted: ["crictl ps -a", "crictl ps --all"],
    grammar: [
      { token: "crictl ps -a", desc: "List all CRI containers (Running and Exited) on the node" }
    ],
    sampleOutput: `CONTAINER       IMAGE           CREATED       STATE     NAME           ATTEMPT
4b2e91f0a11c2   92b1e3f80c21a   3 hours ago   Running   cilium-agent   0`,
    explanation: "Essential when `kube-apiserver` or `kubelet` is down and `kubectl` cannot reach the cluster."
  },
  {
    id: "cnt-crictl-pods",
    session: "containers",
    difficulty: "Intermediate",
    tool: "crictl",
    title: "List all Pod sandboxes on a Kubernetes worker node using crictl",
    prompt: "List all Pod sandboxes on the local node using `crictl`.",
    hint: "Use `crictl pods`.",
    canonical: "crictl pods",
    accepted: ["crictl pods"],
    grammar: [
      { token: "crictl pods", desc: "List Pod sandboxes managed by the CRI runtime on the node" }
    ],
    sampleOutput: `POD ID          CREATED       STATE   NAME           NAMESPACE     ATTEMPT
e81a02c4d91b0   3 hours ago   Ready   cilium-7x92k   kube-system   0`,
    explanation: "Use `crictl inspectp <POD_ID>` to inspect the pod sandbox's network namespace path and IP."
  },
  {
    id: "cnt-crictl-logs",
    session: "containers",
    difficulty: "Intermediate",
    tool: "crictl",
    title: "Fetch logs of a crashed container directly on a Kubernetes node",
    prompt: "Container `9d01a8c3e22f1` exited on a worker node. Fetch its logs using `crictl`.",
    hint: "Use `crictl logs 9d01a8c3e22f1`.",
    canonical: "crictl logs 9d01a8c3e22f1",
    accepted: ["crictl logs 9d01a8c3e22f1", "crictl logs -f 9d01a8c3e22f1"],
    grammar: [
      { token: "crictl logs <ID>", desc: "Fetch container logs directly from containerd/CRI" }
    ],
    sampleOutput: `FATAL failed to open AF_PACKET socket: operation not permitted (missing CAP_NET_RAW)`,
    explanation: "Use `crictl inspect 9d01a8c3e22f1` to inspect container capabilities, mounts, and PID."
  },

  // ============================================================================
  // 5. LINUX SERVICES, SYSTEMD & KERNEL LOGS
  // ============================================================================
  {
    id: "sys-systemctl-status",
    session: "systemd-logs",
    difficulty: "Core",
    tool: "systemctl",
    title: "Check runtime status, main PID, and cgroup memory of kubelet",
    prompt: "Check the systemd service status of `kubelet`.",
    hint: "Use `systemctl status kubelet`.",
    canonical: "systemctl status kubelet",
    accepted: ["systemctl status kubelet", "systemctl status kubelet.service"],
    grammar: [
      { token: "systemctl status kubelet", desc: "Show unit state, main PID, cgroup tasks/memory, and recent logs" }
    ],
    sampleOutput: `● kubelet.service - kubelet: The Kubernetes Node Agent
     Active: active (running) since Mon 2026-11-02 09:00:12 UTC; 9h ago`,
    explanation: "First command to run on a Kubernetes node when the node status flips to `NotReady`."
  },
  {
    id: "sys-systemctl-restart",
    session: "systemd-logs",
    difficulty: "Core",
    tool: "systemctl",
    title: "Restart a systemd service after changing its config",
    prompt: "Restart the `containerd` systemd service.",
    hint: "Use `systemctl restart containerd`.",
    canonical: "systemctl restart containerd",
    accepted: ["systemctl restart containerd", "systemctl restart containerd.service"],
    grammar: [
      { token: "systemctl restart containerd", desc: "Stop and start the containerd.service unit" }
    ],
    sampleOutput: `(containerd.service restarted)`,
    explanation: "If you edited `/etc/systemd/system/*.service`, run `systemctl daemon-reload` before `systemctl restart`."
  },
  {
    id: "sys-systemctl-failed",
    session: "systemd-logs",
    difficulty: "Intermediate",
    tool: "systemctl",
    title: "List all systemd units currently in a failed state",
    prompt: "You just logged into a degraded Linux host. List all systemd units that are in the `--failed` state.",
    hint: "Use `systemctl list-units --failed` (or `systemctl --failed`).",
    canonical: "systemctl list-units --failed",
    accepted: ["systemctl list-units --failed", "systemctl --failed"],
    grammar: [
      { token: "systemctl list-units --failed", desc: "List only units that exited with an error or failed health check" }
    ],
    sampleOutput: `  UNIT               LOAD   ACTIVE SUB    DESCRIPTION
● kubelet.service    loaded failed failed kubelet: The Kubernetes Node Agent`,
    explanation: "Immediately surfaces any broken daemon across the entire OS."
  },
  {
    id: "sys-journalctl-unit",
    session: "systemd-logs",
    difficulty: "Core",
    tool: "journalctl",
    title: "Follow real-time systemd journal logs for kubelet",
    prompt: "Stream (`-f`) the systemd journal logs for the `kubelet` unit (`-u kubelet`).",
    hint: "Use `journalctl -u kubelet -f`.",
    canonical: "journalctl -u kubelet -f",
    accepted: [
      "journalctl -u kubelet -f",
      "journalctl -f -u kubelet",
      "journalctl -fu kubelet",
      "journalctl -uf kubelet"
    ],
    grammar: [
      { token: "journalctl -u kubelet", desc: "Filter logs for unit kubelet.service" },
      { token: "-f", desc: "Follow new log entries in real time" }
    ],
    sampleOutput: `Nov 02 18:36:10 node-1 kubelet[1294]: E1102 "Error syncing pod" err="cni failed to set up pod network"`,
    explanation: "Essential for diagnosing CNI plugin errors, volume mount timeouts, and certificate expiration on nodes."
  },
  {
    id: "sys-journalctl-xe",
    session: "systemd-logs",
    difficulty: "Core",
    tool: "journalctl",
    title: "Jump to the end of the systemd journal with explanatory error context",
    prompt: "Run `journalctl` with the flags that jump to the end of the logs (`-e`) and attach explanatory catalog text (`-x`).",
    hint: "Use `journalctl -xe`.",
    canonical: "journalctl -xe",
    accepted: ["journalctl -xe", "journalctl -ex"],
    grammar: [
      { token: "-x", desc: "Add message catalog explanations" },
      { token: "-e", desc: "Jump straight to the end of the journal" }
    ],
    sampleOutput: `░░ The unit nginx.service has entered the 'failed' state with result 'exit-code'.`,
    explanation: "Use `journalctl -b -1` when a machine rebooted unexpectedly and you want to read the logs from the *previous* boot!"
  },
  {
    id: "sys-dmesg-t",
    session: "systemd-logs",
    difficulty: "Core",
    tool: "dmesg",
    title: "Inspect Linux kernel ring buffer messages with human-readable timestamps",
    prompt: "Print the kernel ring buffer (`dmesg`) with human-readable timestamps (`-T`).",
    hint: "Use `dmesg -T`.",
    canonical: "dmesg -T",
    accepted: ["dmesg -T", "dmesg --ctime", "dmesg -Tw"],
    grammar: [
      { token: "dmesg", desc: "Print kernel ring buffer" },
      { token: "-T", desc: "Convert raw boot seconds into human-readable timestamps" }
    ],
    sampleOutput: `[Mon Nov  2 18:34:11 2026] Out of memory: Killed process 9842 (frametap)
[Mon Nov  2 18:35:02 2026] nf_conntrack: nf_conntrack: table full, dropping packet`,
    explanation: "Exposes kernel OOM kills, `nf_conntrack: table full` packet drops, hardware NIC resets, and filesystem I/O errors."
  },

  // ============================================================================
  // 6. KUBERNETES (kubectl) DEBUGGING
  // ============================================================================
  {
    id: "k8s-get-pods-wide",
    session: "kubectl",
    difficulty: "Core",
    tool: "kubectl",
    title: "List all pods across all namespaces with node placement and pod IPs",
    prompt: "List all pods across all namespaces (`-A`) with extended columns (`-o wide`).",
    hint: "Use `kubectl get pods -A -o wide`.",
    canonical: "kubectl get pods -A -o wide",
    accepted: [
      "kubectl get pods -A -o wide",
      "kubectl get pods -o wide -A",
      "kubectl get po -A -o wide",
      "kubectl get po -o wide -A"
    ],
    grammar: [
      { token: "kubectl get pods -A", desc: "List pods across all namespaces" },
      { token: "-o wide", desc: "Include IP and NODE columns" }
    ],
    sampleOutput: `NAMESPACE   NAME                           READY   STATUS             IP           NODE
prod        payment-api-6d4f8b9c7-x2k9p    0/1     CrashLoopBackOff   10.244.1.48  kind-worker`,
    explanation: "Immediately shows the Pod IP and worker node for any failing workload."
  },
  {
    id: "k8s-describe-pod",
    session: "kubectl",
    difficulty: "Core",
    tool: "kubectl",
    title: "Inspect detailed pod state, exit codes, and kubelet Events",
    prompt: "Run `kubectl describe` on pod `payment-api`.",
    hint: "Use `kubectl describe pod payment-api`.",
    canonical: "kubectl describe pod payment-api",
    accepted: ["kubectl describe pod payment-api", "kubectl describe po payment-api", "kubectl describe pod/payment-api"],
    grammar: [
      { token: "kubectl describe pod payment-api", desc: "Show container states, exit codes, and Events for pod payment-api" }
    ],
    sampleOutput: `Last State:     Terminated
  Reason:       OOMKilled
  Exit Code:    137`,
    explanation: "Check `Last State` for `OOMKilled` (`Exit Code: 137`) and `Events:` for scheduling/image/probe failures."
  },
  {
    id: "k8s-logs-previous",
    session: "kubectl",
    difficulty: "Intermediate",
    tool: "kubectl",
    title: "Fetch logs from the previous crashed container instance",
    prompt: "Pod `payment-api` is in `CrashLoopBackOff`. Fetch the logs from its **previous** crashed container instance (`--previous` / `-p`).",
    hint: "Use `kubectl logs payment-api --previous`.",
    canonical: "kubectl logs payment-api --previous",
    accepted: [
      "kubectl logs payment-api --previous",
      "kubectl logs -p payment-api",
      "kubectl logs payment-api -p",
      "kubectl logs --previous payment-api"
    ],
    grammar: [
      { token: "kubectl logs payment-api", desc: "Fetch container logs" },
      { token: "--previous", desc: "(Or -p) Fetch logs of the previous terminated container instance" }
    ],
    sampleOutput: `panic: runtime error: invalid memory address or nil pointer dereference`,
    explanation: "Without `--previous`, `kubectl logs` only queries the newly restarted container."
  },
  {
    id: "k8s-exec-shell",
    session: "kubectl",
    difficulty: "Core",
    tool: "kubectl",
    title: "Open an interactive sh shell inside a running Kubernetes Pod",
    prompt: "Execute an interactive (`-it`) `sh` shell inside pod `payment-api`.",
    hint: "Use `kubectl exec -it payment-api -- sh`.",
    canonical: "kubectl exec -it payment-api -- sh",
    accepted: [
      "kubectl exec -it payment-api -- sh",
      "kubectl exec -it payment-api -- /bin/sh",
      "kubectl exec -it payment-api -- bash",
      "kubectl exec -it payment-api sh"
    ],
    grammar: [
      { token: "kubectl exec -it payment-api", desc: "Run interactive TTY command in pod payment-api" },
      { token: "-- sh", desc: "Separator (--) followed by command to execute inside the container" }
    ],
    sampleOutput: `/app # wget -qO- http://localhost:8080/healthz`,
    explanation: "If a pod has multiple containers (e.g. app + Envoy sidecar), pass `-c <container-name>`."
  },
  {
    id: "k8s-get-events-sorted",
    session: "kubectl",
    difficulty: "Intermediate",
    tool: "kubectl",
    title: "List cluster events sorted chronologically by creationTimestamp",
    prompt: "List Kubernetes events sorted by `.metadata.creationTimestamp`.",
    hint: "Use `kubectl get events --sort-by=.metadata.creationTimestamp`.",
    canonical: "kubectl get events --sort-by=.metadata.creationTimestamp",
    accepted: [
      "kubectl get events --sort-by=.metadata.creationTimestamp",
      "kubectl get ev --sort-by=.metadata.creationTimestamp"
    ],
    grammar: [
      { token: "--sort-by=.metadata.creationTimestamp", desc: "Order events chronologically from oldest to newest" }
    ],
    sampleOutput: `2m05s  Warning  Unhealthy  pod/payment-api  Readiness probe failed: HTTP probe failed with statuscode: 503`,
    explanation: "Gives a chronological timeline of scheduling, probe, and CNI events."
  },
  {
    id: "k8s-get-endpoints",
    session: "kubectl",
    difficulty: "Intermediate",
    tool: "kubectl",
    title: "Verify whether a Kubernetes Service has healthy backing Pod IPs",
    symptomOutput: `$ curl http://payment-svc.default.svc.cluster.local:8080
curl: (7) Failed to connect to payment-svc.default.svc.cluster.local port 8080: Connection refused`,
    prompt: "ClusterIP service `payment-svc` refuses connections. Check the `endpoints` object for `payment-svc` to see if any Ready Pod IPs are registered behind the Service.",
    hint: "Use `kubectl get endpoints payment-svc` (or `kubectl get ep payment-svc`).",
    canonical: "kubectl get endpoints payment-svc",
    accepted: ["kubectl get endpoints payment-svc", "kubectl get ep payment-svc", "kubectl describe endpoints payment-svc"],
    grammar: [
      { token: "kubectl get endpoints payment-svc", desc: "Inspect populated Pod IP:Port endpoints for Service payment-svc" }
    ],
    sampleOutput: `NAME          ENDPOINTS   AGE
payment-svc   <none>      14m`,
    explanation: "`ENDPOINTS: <none>` means either the Service label selector doesn't match the Pod labels, or all Pods are failing their `readinessProbe`."
  },
  {
    id: "k8s-top-pods",
    session: "kubectl",
    difficulty: "Core",
    tool: "kubectl",
    title: "Check live CPU and memory consumption of pods across all namespaces",
    prompt: "Use `kubectl top` to view live CPU (millicores) and memory (MiB) usage of pods across all namespaces (`-A`).",
    hint: "Use `kubectl top pods -A`.",
    canonical: "kubectl top pods -A",
    accepted: ["kubectl top pods -A", "kubectl top pod -A", "kubectl top po -A"],
    grammar: [
      { token: "kubectl top pods -A", desc: "Query metrics-server for live pod CPU and memory usage across all namespaces" }
    ],
    sampleOutput: `NAMESPACE   NAME                           CPU(cores)   MEMORY(bytes)
prod        payment-api-6d4f8b9c7-x2k9p    420m         498Mi`,
    explanation: "Add `--containers` (`kubectl top pods -A --containers`) to break down usage per container inside multi-container pods."
  },
  {
    id: "k8s-rollout-undo",
    session: "kubectl",
    difficulty: "Core",
    tool: "kubectl",
    title: "Immediately roll back a broken Kubernetes Deployment to its previous revision",
    prompt: "A canary release of Deployment `payment-api` is throwing 500s. Roll back `deployment/payment-api` to the previous working ReplicaSet revision.",
    hint: "Use `kubectl rollout undo deployment/payment-api`.",
    canonical: "kubectl rollout undo deployment/payment-api",
    accepted: [
      "kubectl rollout undo deployment/payment-api",
      "kubectl rollout undo deployment payment-api",
      "kubectl rollout undo deploy/payment-api",
      "kubectl rollout undo deploy payment-api"
    ],
    grammar: [
      { token: "kubectl rollout undo", desc: "Revert a workload to its previous revision" },
      { token: "deployment/payment-api", desc: "Target Deployment resource" }
    ],
    sampleOutput: `deployment.apps/payment-api rolled back`,
    explanation: "Follow up with `kubectl rollout status deployment/payment-api` to watch the rollback complete in real time."
  },
  {
    id: "k8s-port-forward",
    session: "kubectl",
    difficulty: "Core",
    tool: "kubectl",
    title: "Forward local port 9090 to port 9090 on a Prometheus pod for debugging",
    prompt: "Forward local port `9090` to port `9090` (`9090:9090`) on pod `prometheus-0`.",
    hint: "Use `kubectl port-forward prometheus-0 9090:9090`.",
    canonical: "kubectl port-forward prometheus-0 9090:9090",
    accepted: [
      "kubectl port-forward prometheus-0 9090:9090",
      "kubectl port-forward pod/prometheus-0 9090:9090"
    ],
    grammar: [
      { token: "kubectl port-forward", desc: "Tunnel local TCP port to a Pod or Service via the K8s API server" },
      { token: "prometheus-0 9090:9090", desc: "Target pod and <local-port>:<remote-port>" }
    ],
    sampleOutput: `Forwarding from 127.0.0.1:9090 -> 9090`,
    explanation: "Lets you hit internal admin/metrics/pprof endpoints (`localhost:9090`) without exposing an Ingress or LoadBalancer."
  },

  // ============================================================================
  // 7. HELM, CILIUM & HUBBLE (eBPF / CNI)
  // ============================================================================
  {
    id: "hc-helm-list",
    session: "helm-cilium",
    difficulty: "Core",
    tool: "helm",
    title: "List all deployed Helm releases across all namespaces",
    prompt: "List all Helm releases across all namespaces (`-A`).",
    hint: "Use `helm list -A`.",
    canonical: "helm list -A",
    accepted: ["helm list -A", "helm ls -A", "helm list --all-namespaces"],
    grammar: [
      { token: "helm list -A", desc: "List Helm releases across all Kubernetes namespaces" }
    ],
    sampleOutput: `NAME        NAMESPACE     REVISION  STATUS    CHART           APP VERSION
cilium      kube-system   2         deployed  cilium-1.16.3   1.16.3`,
    explanation: "Without `-A`, `helm list` only checks your active namespace."
  },
  {
    id: "hc-helm-get-values",
    session: "helm-cilium",
    difficulty: "Core",
    tool: "helm",
    title: "Inspect user-supplied values for a deployed Helm release",
    prompt: "Fetch the custom configuration values applied to the `cilium` Helm release.",
    hint: "Use `helm get values cilium`.",
    canonical: "helm get values cilium",
    accepted: ["helm get values cilium", "helm get values cilium -a"],
    grammar: [
      { token: "helm get values cilium", desc: "Output user-supplied override values for release cilium" }
    ],
    sampleOutput: `USER-SUPPLIED VALUES:
kubeProxyReplacement: true`,
    explanation: "Add `-a` (`helm get values cilium -a`) to also include computed chart default values."
  },
  {
    id: "hc-helm-history",
    session: "helm-cilium",
    difficulty: "Core",
    tool: "helm",
    title: "View revision history of a Helm release before rolling back",
    prompt: "Display the revision history of the `prometheus` Helm release.",
    hint: "Use `helm history prometheus`.",
    canonical: "helm history prometheus",
    accepted: ["helm history prometheus"],
    grammar: [
      { token: "helm history prometheus", desc: "Show revision numbers, timestamps, statuses, and chart versions" }
    ],
    sampleOutput: `REVISION  STATUS      CHART             DESCRIPTION
3         superseded  kube-prom-65.0    Upgrade complete
4         failed      kube-prom-65.1    Upgrade "prometheus" failed: timed out`,
    explanation: "Tells you which revision number (`3`) is safe to pass to `helm rollback`."
  },
  {
    id: "hc-helm-rollback",
    session: "helm-cilium",
    difficulty: "Core",
    tool: "helm",
    title: "Rollback a failed Helm release to revision 3",
    prompt: "Roll back the `prometheus` Helm release to revision `3`.",
    hint: "Use `helm rollback prometheus 3`.",
    canonical: "helm rollback prometheus 3",
    accepted: ["helm rollback prometheus 3"],
    grammar: [
      { token: "helm rollback prometheus 3", desc: "Roll back release 'prometheus' to revision 3" }
    ],
    sampleOutput: `Rollback was a success! Happy Helming!`,
    explanation: "Creates a new revision (Revision 5) matching the state of Revision 3."
  },
  {
    id: "hc-helm-template",
    session: "helm-cilium",
    difficulty: "Intermediate",
    tool: "helm",
    title: "Render Helm chart templates locally without installing to a cluster",
    prompt: "Render the YAML manifests for release `my-app` from chart `./chart` locally to stdout.",
    hint: "Use `helm template my-app ./chart`.",
    canonical: "helm template my-app ./chart",
    accepted: ["helm template my-app ./chart", "helm template ./chart"],
    grammar: [
      { token: "helm template my-app ./chart", desc: "Render chart templates locally without contacting kube-apiserver" }
    ],
    sampleOutput: `apiVersion: apps/v1
kind: Deployment`,
    explanation: "Great for debugging Go template expressions or piping into `kubectl diff -f -`."
  },
  {
    id: "hc-cilium-status",
    session: "helm-cilium",
    difficulty: "Core",
    tool: "cilium",
    title: "Check Cilium CNI health, Operator status, and Hubble Relay state",
    prompt: "Run the Cilium CLI command to check overall Cilium health across the cluster.",
    hint: "Use `cilium status`.",
    canonical: "cilium status",
    accepted: ["cilium status", "cilium status --wait"],
    grammar: [
      { token: "cilium status", desc: "Inspect Cilium DaemonSet, Operator, Envoy, and Hubble Relay health" }
    ],
    sampleOutput: `Cilium:             OK
Operator:           OK
Hubble Relay:       OK`,
    explanation: "First command to run when checking eBPF CNI health."
  },
  {
    id: "hc-cilium-connectivity",
    session: "helm-cilium",
    difficulty: "Intermediate",
    tool: "cilium",
    title: "Run Cilium's automated end-to-end cluster connectivity test suite",
    prompt: "Run the Cilium CLI command that validates pod-to-pod, service, DNS, and L3/L4/L7 policy connectivity.",
    hint: "Use `cilium connectivity test`.",
    canonical: "cilium connectivity test",
    accepted: ["cilium connectivity test"],
    grammar: [
      { token: "cilium connectivity test", desc: "Deploy test pods and run eBPF datapath & policy verification suite" }
    ],
    sampleOutput: `✅ [cilium-test] All 42 tests (298 actions) successful`,
    explanation: "Validates that eBPF kube-proxy replacement, masquerading, and cross-node routing work end-to-end."
  },
  {
    id: "hc-cilium-monitor-drop",
    session: "helm-cilium",
    difficulty: "Intermediate",
    tool: "cilium",
    title: "Stream real-time eBPF datapath packet drops from Cilium",
    prompt: "Run `cilium monitor` filtered specifically for dropped packets (`--type drop`).",
    hint: "Use `cilium monitor --type drop`.",
    canonical: "cilium monitor --type drop",
    accepted: ["cilium monitor --type drop", "cilium monitor", "cilium-dbg monitor --type drop"],
    grammar: [
      { token: "cilium monitor", desc: "Read events from Cilium's kernel eBPF perf/ring buffer" },
      { token: "--type drop", desc: "Show only packet drop events and their BPF source line/reason" }
    ],
    sampleOutput: `xx drop (Policy denied) flow 0x8a41 to endpoint 1042, file bpf_lxc.c:1984, [10.244.1.15:48912 -> 10.244.2.80:6379 tcp SYN]`,
    explanation: "Prints the exact C file and line in Cilium's eBPF program (`bpf_lxc.c:1984`) that dropped the packet."
  },
  {
    id: "hc-cilium-bpf-lb",
    session: "helm-cilium",
    difficulty: "Cisco / SRE Scenario",
    tool: "cilium",
    title: "Inspect Cilium's in-kernel eBPF load-balancing map (kube-proxy replacement)",
    prompt: "When Cilium runs in `kubeProxyReplacement` mode, Kubernetes Services are load-balanced via eBPF maps instead of `iptables`. Run the `cilium bpf` command to list the eBPF load-balancer (`lb`) service map entries.",
    hint: "Use `cilium bpf lb list`.",
    canonical: "cilium bpf lb list",
    accepted: ["cilium bpf lb list", "cilium-dbg bpf lb list", "cilium service list"],
    grammar: [
      { token: "cilium bpf lb list", desc: "Dump the kernel eBPF load-balancer map mapping Service VIPs to backend Pod IPs" }
    ],
    sampleOutput: `SERVICE ADDRESS        BACKEND ADDRESS (REVNAT_ID) (SLOT)
10.96.0.10:53/UDP      10.244.0.41:53 (2) (1)
                       10.244.1.19:53 (2) (2)`,
    explanation: "In eBPF kube-proxy replacement mode, `iptables -L` won't show Kubernetes Services—`cilium bpf lb list` inspects the actual kernel BPF hash map performing socket-level (`sockops`) and TC DNAT!"
  },
  {
    id: "hc-hubble-observe-drop",
    session: "helm-cilium",
    difficulty: "Core",
    tool: "hubble",
    title: "Observe dropped network flows across the cluster using Hubble CLI",
    prompt: "Use `hubble observe` to filter specifically for flows with verdict `DROPPED` (`--verdict DROPPED`).",
    hint: "Use `hubble observe --verdict DROPPED`.",
    canonical: "hubble observe --verdict DROPPED",
    accepted: ["hubble observe --verdict DROPPED", "hubble observe"],
    grammar: [
      { token: "hubble observe", desc: "Query Cilium Hubble eBPF flow telemetry" },
      { token: "--verdict DROPPED", desc: "Filter exclusively for packets dropped by NetworkPolicy or L3/L4 errors" }
    ],
    sampleOutput: `Nov  2 18:45:12 default/checkout-5b9d:39104 -> default/payments-8c1a:8443 PolicyVerdict:all EGRESS DROPPED (TCP Flags: SYN)`,
    explanation: "Tells you immediately whether an `INGRESS` or `EGRESS` policy denied the flow."
  },

  // ============================================================================
  // 8. GIT, TERRAFORM, GO & PROMQL
  // ============================================================================
  {
    id: "gtg-git-status",
    session: "git-tf-go",
    difficulty: "Core",
    tool: "git",
    title: "Check working tree status",
    prompt: "Display modified, staged, and untracked files in the Git working tree.",
    hint: "Use `git status`.",
    canonical: "git status",
    accepted: ["git status", "git status -s"],
    grammar: [
      { token: "git status", desc: "Show working tree and staging area status" }
    ],
    sampleOutput: `On branch main
modified:   pkg/sniffer/afpacket.go`,
    explanation: "Use `git status -s` for a compact 1-line-per-file view."
  },
  {
    id: "gtg-git-diff-staged",
    session: "git-tf-go",
    difficulty: "Core",
    tool: "git",
    title: "Inspect line-by-line diff of changes staged for the next commit",
    prompt: "You ran `git add .` and want to review the exact diff of what is staged before running `git commit`. Run `git diff` for staged changes.",
    hint: "Use `git diff --staged` (or `git diff --cached`).",
    canonical: "git diff --staged",
    accepted: ["git diff --staged", "git diff --cached", "git diff"],
    grammar: [
      { token: "git diff --staged", desc: "Compare the staging index against HEAD (whereas bare git diff compares working tree to index)" }
    ],
    sampleOutput: `+	fd, err := unix.Socket(unix.AF_PACKET, unix.SOCK_RAW, int(htons(unix.ETH_P_ALL)))`,
    explanation: "Running `git diff --staged` before every commit prevents accidentally committing debug print statements or secrets."
  },
  {
    id: "gtg-git-log-oneline",
    session: "git-tf-go",
    difficulty: "Core",
    tool: "git",
    title: "View compact commit history with one commit per line",
    prompt: "Display the Git commit log formatted as one line per commit (`--oneline`).",
    hint: "Use `git log --oneline`.",
    canonical: "git log --oneline",
    accepted: ["git log --oneline", "git log --oneline --graph"],
    grammar: [
      { token: "git log --oneline", desc: "Show short 7-char commit SHA and subject line" }
    ],
    sampleOutput: `9f81a2c (HEAD -> main) feat(arp): decode IPv4 over Ethernet ARP replies`,
    explanation: "Use `git show <sha>` to inspect the full diff of any commit from `git log --oneline`."
  },
  {
    id: "gtg-git-switch-c",
    session: "git-tf-go",
    difficulty: "Core",
    tool: "git",
    title: "Create and switch to a new Git branch using git switch",
    prompt: "Use `git switch` to create (`-c`) and switch to a new branch named `fix/mtu`.",
    hint: "Use `git switch -c fix/mtu`.",
    canonical: "git switch -c fix/mtu",
    accepted: ["git switch -c fix/mtu", "git checkout -b fix/mtu"],
    grammar: [
      { token: "git switch -c fix/mtu", desc: "Create (-c) and switch to branch fix/mtu" }
    ],
    sampleOutput: `Switched to a new branch 'fix/mtu'`,
    explanation: "`git switch` and `git restore` replace the overloaded legacy `git checkout` command."
  },
  {
    id: "gtg-git-restore",
    session: "git-tf-go",
    difficulty: "Core",
    tool: "git",
    title: "Discard uncommitted local modifications in a file using git restore",
    prompt: "Discard your unstaged working-tree edits in `main.go` using `git restore`.",
    hint: "Use `git restore main.go`.",
    canonical: "git restore main.go",
    accepted: ["git restore main.go", "git checkout -- main.go"],
    grammar: [
      { token: "git restore main.go", desc: "Restore working-tree file main.go from the index (use --staged to unstage)" }
    ],
    sampleOutput: `(main.go restored to clean state)`,
    explanation: "Use `git restore --staged main.go` to unstage a file after `git add` without losing your working-tree edits."
  },
  {
    id: "gtg-git-stash",
    session: "git-tf-go",
    difficulty: "Core",
    tool: "git",
    title: "Temporarily shelve uncommitted changes onto the Git stash stack",
    prompt: "Save your uncommitted local modifications to the stash stack so you can switch branches cleanly.",
    hint: "Use `git stash`.",
    canonical: "git stash",
    accepted: ["git stash", "git stash push"],
    grammar: [
      { token: "git stash", desc: "Push uncommitted tracked modifications onto the stash stack" }
    ],
    sampleOutput: `Saved working directory and index state WIP on main: 9f81a2c`,
    explanation: "Run `git stash pop` later to re-apply and remove the top stash entry."
  },
  {
    id: "gtg-git-bisect",
    session: "git-tf-go",
    difficulty: "Intermediate",
    tool: "git",
    title: "Start a binary search across Git commits to find a regression",
    prompt: "Start an interactive `git bisect` session.",
    hint: "Use `git bisect start`.",
    canonical: "git bisect start",
    accepted: ["git bisect start"],
    grammar: [
      { token: "git bisect start", desc: "Start binary search across commit history (followed by git bisect bad & git bisect good <sha>)" }
    ],
    sampleOutput: `status: waiting for both good and bad commits`,
    explanation: "Automate regression hunting with `git bisect run go test ./...`."
  },
  {
    id: "gtg-tf-state-list",
    session: "git-tf-go",
    difficulty: "Core",
    tool: "terraform",
    title: "List all resources tracked in the Terraform state file",
    prompt: "List all infrastructure resource addresses in Terraform state.",
    hint: "Use `terraform state list`.",
    canonical: "terraform state list",
    accepted: ["terraform state list"],
    grammar: [
      { token: "terraform state list", desc: "List all resource addresses tracked in Terraform state" }
    ],
    sampleOutput: `aws_vpc.main
aws_eks_cluster.prod
helm_release.cilium`,
    explanation: "Use `terraform state show <resource>` to inspect a specific resource's attributes."
  },
  {
    id: "gtg-tf-plan",
    session: "git-tf-go",
    difficulty: "Core",
    tool: "terraform",
    title: "Preview infrastructure changes and detect drift with Terraform",
    prompt: "Run the Terraform command that compares desired `.tf` configuration against live cloud state and prints the execution plan.",
    hint: "Use `terraform plan`.",
    canonical: "terraform plan",
    accepted: ["terraform plan"],
    grammar: [
      { token: "terraform plan", desc: "Compute and preview resource additions (+), changes (~), and replacements (-/+)" }
    ],
    sampleOutput: `Plan: 1 to add, 1 to change, 0 to destroy.`,
    explanation: "Always inspect `terraform plan` output for unexpected `must be replaced` (`-/+`) actions before applying."
  },
  {
    id: "gtg-go-test-race",
    session: "git-tf-go",
    difficulty: "Core",
    tool: "go",
    title: "Run all Go unit tests recursively across the module",
    prompt: "Run `go test` across all packages in the current repository (`./...`).",
    hint: "Use `go test ./...`.",
    canonical: "go test ./...",
    accepted: ["go test ./...", "go test -v ./...", "go test -race ./..."],
    grammar: [
      { token: "go test ./...", desc: "Test all packages in the current module tree (add -race to detect concurrency data races)" }
    ],
    sampleOutput: `ok  	github.com/Sanjeevliv/frametap/pkg/ethernet	0.014s`,
    explanation: "Pass `-race` (`go test -race ./...`) whenever testing concurrent Go code with goroutines and channels."
  },
  {
    id: "gtg-go-bench",
    session: "git-tf-go",
    difficulty: "Intermediate",
    tool: "go",
    title: "Run Go benchmarks to measure ns/op and heap allocations",
    prompt: "Run all Go benchmarks in the current package using `go test`.",
    hint: "Use `go test -bench=.`.",
    canonical: "go test -bench=.",
    accepted: ["go test -bench=.", "go test -bench .", "go test -bench=. -benchmem"],
    grammar: [
      { token: "-bench=.", desc: "Run all Benchmark* functions matching '.'" },
      { token: "-benchmem", desc: "(Optional) Report heap allocations (B/op and allocs/op)" }
    ],
    sampleOutput: `BenchmarkDecodeEthernet-8   100000000   10.42 ns/op   0 B/op   0 allocs/op`,
    explanation: "Zero allocations (`0 allocs/op`) on the packet decode path avoids GC latency spikes."
  },
  {
    id: "gtg-go-vet",
    session: "git-tf-go",
    difficulty: "Core",
    tool: "go",
    title: "Run Go static analysis (go vet) across all packages",
    prompt: "Run `go vet` across all packages (`./...`).",
    hint: "Use `go vet ./...`.",
    canonical: "go vet ./...",
    accepted: ["go vet ./..."],
    grammar: [
      { token: "go vet ./...", desc: "Static checker for suspicious constructs (copied mutexes, printf format bugs, unreachable code)" }
    ],
    sampleOutput: `pkg/sniffer/capture.go:88:14: call of fmt.Printf copies lock value: sync.Mutex`,
    explanation: "Catches bugs that compile cleanly but fail at runtime."
  },
  {
    id: "gtg-go-pprof",
    session: "git-tf-go",
    difficulty: "Intermediate",
    tool: "go",
    title: "Analyze a Go CPU or heap profile using go tool pprof",
    prompt: "Open `cpu.prof` using Go's built-in profiler (`pprof`).",
    hint: "Use `go tool pprof cpu.prof`.",
    canonical: "go tool pprof cpu.prof",
    accepted: ["go tool pprof cpu.prof", "go tool pprof"],
    grammar: [
      { token: "go tool pprof cpu.prof", desc: "Launch interactive CPU/memory/goroutine profile analyzer" }
    ],
    sampleOutput: `(pprof) top
1.20s 60.00%  syscall.Syscall6`,
    explanation: "Use `go tool pprof -http=:8081 cpu.prof` to view an interactive flamegraph in your browser."
  },
  {
    id: "gtg-promql-rate",
    session: "git-tf-go",
    difficulty: "Intermediate",
    tool: "promql",
    title: "Calculate per-second HTTP request rate over a 5-minute window in PromQL",
    prompt: "Write the PromQL query to compute the per-second rate of `http_requests_total` over `[5m]`.",
    hint: "Use `rate(http_requests_total[5m])`.",
    canonical: "rate(http_requests_total[5m])",
    accepted: ["rate(http_requests_total[5m])", "sum(rate(http_requests_total[5m]))"],
    grammar: [
      { token: "rate(http_requests_total[5m])", desc: "Per-second average rate of increase of counter over 5 minutes" }
    ],
    sampleOutput: `{job="payment-api", status="200"} => 482.19`,
    explanation: "Always apply `rate()` to Counter metrics before graphing or summing across pods."
  },

  // ============================================================================
  // 9. MULTI-STEP INCIDENT CHAINS (REAL-WORLD CISCO / SRE LIVE DEBUGGING)
  // ============================================================================
  {
    id: "chain-port-refused",
    session: "cisco-incidents",
    difficulty: "Cisco / SRE Scenario",
    tool: "Incident Chain (3 Steps)",
    title: "Incident Chain: Service Connection Refused on Port 8080",
    explanation: "In production debugging, you verify socket bindings (`ss -tulpn`), inspect the service's journal logs (`journalctl -u`), and restart/verify the daemon (`systemctl restart`).",
    steps: [
      {
        prompt: "STEP 1 of 3: External clients get `Connection refused` on port `8080`. First, inspect all listening TCP/UDP sockets with numeric ports and owning processes to see what is bound to `:8080`.",
        hint: "Use `ss -tulpn`.",
        canonical: "ss -tulpn",
        accepted: ["ss -tulpn", "lsof -i :8080"],
        output: `Netid State  Recv-Q Send-Q Local Address:Port  Peer Address:Port Process
tcp   LISTEN 0      4096   127.0.0.1:8080      0.0.0.0:*         users:(("envoy",pid=3109,fd=9))`
      },
      {
        prompt: "STEP 2 of 3: Look at the output above—`envoy` is bound to loopback `127.0.0.1:8080` instead of `0.0.0.0:8080`! Follow (`-f`) the systemd journal logs for the `envoy` unit (`-u envoy`) to check which config file it loaded.",
        hint: "Use `journalctl -u envoy -f`.",
        canonical: "journalctl -u envoy -f",
        accepted: ["journalctl -u envoy -f", "journalctl -fu envoy", "journalctl -u envoy"],
        output: `Nov 02 22:05:01 node-1 envoy[3109]:loaded listener_address: 127.0.0.1:8080 from /etc/envoy/envoy.yaml`
      },
      {
        prompt: "STEP 3 of 3: You fixed `/etc/envoy/envoy.yaml` to bind `0.0.0.0:8080`. Now restart the `envoy` systemd service.",
        hint: "Use `systemctl restart envoy`.",
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
    difficulty: "Cisco / SRE Scenario",
    tool: "Incident Chain (3 Steps)",
    title: "Incident Chain: Kubernetes Pod Timeout & Cilium Policy Drop",
    explanation: "When a Kubernetes microservice times out, first check Cilium health (`cilium status`), then inspect dropped flows with Hubble (`hubble observe --verdict DROPPED`), and verify service endpoints (`kubectl get endpoints`).",
    steps: [
      {
        prompt: "STEP 1 of 3: Pod `checkout` is timing out when calling `payments-svc`. First, check overall Cilium CNI health in the cluster.",
        hint: "Use `cilium status`.",
        canonical: "cilium status",
        accepted: ["cilium status"],
        output: `Cilium:             OK
Operator:           OK
Hubble Relay:       OK`
      },
      {
        prompt: "STEP 2 of 3: Cilium is healthy. Now use the Hubble CLI to observe only flows with verdict `DROPPED` (`--verdict DROPPED`) to see if a NetworkPolicy is blocking `checkout`.",
        hint: "Use `hubble observe --verdict DROPPED`.",
        canonical: "hubble observe --verdict DROPPED",
        accepted: ["hubble observe --verdict DROPPED"],
        output: `Nov  2 22:08:11 default/checkout-5b9d:49120 -> default/payments-8c1a:8443 PolicyVerdict:all EGRESS DROPPED (TCP Flags: SYN)`
      },
      {
        prompt: "STEP 3 of 3: Hubble proved an Egress policy dropped TCP SYN to port 8443! After updating the policy, verify that Service `payments-svc` has healthy backing Pod IPs (`endpoints`).",
        hint: "Use `kubectl get endpoints payments-svc`.",
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
    difficulty: "Cisco / SRE Scenario",
    tool: "Incident Chain (3 Steps)",
    title: "Incident Chain: Node Disk 100% Full After Deleting Logs",
    explanation: "When `df -h` and `du -sh` disagree after deleting a large log file, `lsof +L1` identifies the process holding the unlinked file descriptor open.",
    steps: [
      {
        prompt: "STEP 1 of 3: An alert says disk space is critically low. First, check mounted filesystem usage in human-readable format.",
        hint: "Use `df -h`.",
        canonical: "df -h",
        accepted: ["df -h", "df -Th"],
        output: `Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p1   50G   49G  1.0G  98% /`
      },
      {
        prompt: "STEP 2 of 3: You deleted `/var/log/huge.log`, yet `/` is still 98% full! Run `lsof` to list open files with a hard link count less than 1 (`+L1`).",
        hint: "Use `lsof +L1`.",
        canonical: "lsof +L1",
        accepted: ["lsof +L1", "lsof | grep deleted"],
        output: `COMMAND   PID USER   FD   TYPE DEVICE    SIZE/OFF NLINK NODE NAME
 fluentd 4821 root    9w   REG  259,1 42949672960     0 9182 /var/log/huge.log (deleted)`
      },
      {
        prompt: "STEP 3 of 3: PID `4821` (`fluentd`) is still holding the deleted 40GB file open and ignoring SIGTERM. Forcefully kill PID `4821` with `SIGKILL` (`-9`) to free the disk blocks immediately.",
        hint: "Use `kill -9 4821`.",
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
  }
];
