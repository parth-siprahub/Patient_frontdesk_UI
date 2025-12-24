# How to Scrub Sensitive Data from GitHub History

> [!WARNING]
> These commands **rewrite history**. This means all commit hashes will change.
> Collaborators will need to re-clone the repository.
> **Backup your work** before running these commands.

## Option 1: Using BFG Repo-Cleaner (Recommended - Easiest)
BFG is a simple, high-performance tool for removing bad data like passwords or huge files.

1.  **Download BFG**: [https://rtyley.github.io/bfg-repo-cleaner/](https://rtyley.github.io/bfg-repo-cleaner/) (It's a Java jar file).
2.  **Create a expressions.txt file**:
    Create a file named `expressions.txt` and put the **actual text of the keys** you want to delete in it (one per line).
    *Example content*:
    ```text
    AIzaSyA_AGY-a5_ZSTafY25o6V_nJc9wRmnDx7o
    6847c600d8074932b14a9a3a15aa7988
    AIzaSyAYS_kjax9v8vFrkQfcgyA0TloS_HS8yrs
    ```
3.  **Run BFG**:
    ```bash
    java -jar bfg.jar --replace-text expressions.txt .
    ```
4.  **Cleaning**:
    ```bash
    git reflog expire --expire=now --all && git gc --prune=now --aggressive
    ```
5.  **Force Push**:
    ```bash
    git push --force
    ```

## Option 2: Using `git-filter-repo` (Python Standard)
Since you are in a Python environment, this might be native for you.

1.  **Install**:
    ```bash
    pip install git-filter-repo
    ```

2.  **Scrub specific strings**:
    Create a `expressions.txt` containing the keys (same as above).
    ```bash
    git filter-repo --replace-text expressions.txt
    ```
    *Note: This replaces the sensitive string with `***` wherever it appears in history.*

3.  **Force Push**:
    ```bash
    git push --force --all
    ```

## Verification
After pushing, check your GitHub commit history (e.g., commit `ad7120d`) to ensure the keys effectively read as `***REMOVED***` or similar.

> [!IMPORTANT]
> If your API keys are still active, **generating new keys** (which you already did) is the safest first step. Scrubbing history is just to clean the record.
