# GitHub 자동화 워크플로우 규칙

프로젝트에서 GitHub 이슈/브랜치/커밋/PR을 자동으로 생성할 때 따르는 규칙.\
**특정 레포에 종속되지 않고, 현재 작업 중인 프로젝트의 git 설정을 그대로 사용한다.**

---

## 0. 프로젝트 정보 자동 감지 (플로우 시작 전 필수)

다른 작업을 하기 전에 아래 정보를 먼저 파악한다. 이후 모든 단계에서 `OWNER/REPO`, `BASE_BRANCH` 등은 이 단계에서 구한 값을 사용한다.

```bash
# 현재 레포 owner/repo, 기본 브랜치 확인
gh repo view --json owner,name,defaultBranchRef \
  -q '{owner: .owner.login, repo: .name, base: .defaultBranchRef.name}'

# origin remote 확인 (gh repo view 실패 시 fallback)
git remote get-url origin
```

- `OWNER/REPO` = 위 명령 결과로 대체 (예: `--repo OWNER/REPO` 자리에 매번 실제 값 대입)
- `BASE_BRANCH` = `defaultBranchRef.name` (보통 `main`, 레포에 따라 `master`, `develop` 등일 수 있음)
- `gh repo view`가 실패하면(레포가 없거나 초기화 안 됨) → [초기화](#%EC%B4%88%EA%B8%B0%ED%99%94-gitremote-%EC%97%86%EB%8A%94-%EA%B2%BD%EC%9A%B0) 단계로

### 이슈/PR 템플릿 감지

레포 자체에 템플릿이 있으면 **그것을 우선 사용**하고, 없을 때만 아래 기본 템플릿을 쓴다.

```bash
# 이슈 템플릿 존재 확인
ls .github/ISSUE_TEMPLATE/ 2>/dev/null

# PR 템플릿 존재 확인
ls .github/PULL_REQUEST_TEMPLATE.md .github/pull_request_template.md 2>/dev/null
```

- 템플릿 파일이 있으면 → 해당 파일 내용을 그대로 `--body-file`로 사용
- 없으면 → [기본 템플릿](#%EA%B8%B0%EB%B3%B8-%ED%85%9C%ED%94%8C%EB%A6%BF) 사용

### 라벨 존재 여부 감지

```bash
gh label list --repo OWNER/REPO --json name -q '.[].name'
```

- 아래에서 쓰는 라벨(`feature`, `bug`, `refactor`)이 이 목록에 없으면 **라벨을 붙이지 않고 진행** (임의로 라벨을 새로 만들지 않음)

- 필요 시에만 사용자에게 라벨 생성 여부를 확인 후 생성:

  ```bash
  gh label create feature --repo OWNER/REPO --color "84b6eb"
  ```

---

## 플로우

```
0. 프로젝트 정보 감지 (owner/repo, base 브랜치, 템플릿, 라벨)
1. 이슈 확인/생성
2. 브랜치 생성
3. 커밋 + push
4. PR 생성
5. 머지 (충돌 해결 포함)
```

---

## 1. 이슈 (Issue)

### 타입별 제목 형식

타입제목라벨기능 추가/개선`[FEAT] 설명feature`버그 수정`[BUG] 설명bug`유지 보수`[REFACTOR] 설명refactor`

### 타입 자동 추론

- `fix`, `bug`, `수정` → BUG
- `docs`, `문서`, `readme` → REFACTOR
- `refactor` → REFACTOR
- 그 외 → FEATURE

### 기존 이슈 매칭

- 내 이슈 목록(`--assignee @me`)에서 Jaccard 유사도 ≥ 0.3이면 기존 이슈 재사용
- 매칭 실패 시 새 이슈 생성

### 기본 템플릿

레포에 자체 템플릿이 없을 때만 사용.

**feature:**

```markdown
## #️⃣ 요청 유형

- [ ] 새로운 기능 추가
- [ ] 기존 기능 개선
- [ ] 성능 개선

## #️⃣ 어떤 기능인가요?

{설명}

## #️⃣ 이 기능이 필요한 이유는 무엇인가요?

{이유}

## 구현 방안 (선택)

{구현 방안}

## #️⃣ 작업 상세 내용

- [ ] TODO

## 📎 참고할만한 자료 (선택)
```

**bug:**

```markdown
## #️⃣ 어떤 버그인가요?

{설명}

## #️⃣ 어떤 상황에서 발생한 버그인가요?

{Given-When-Then}

## #️⃣ 예상 결과

{예상}

## #️⃣ 실제 결과

{실제}

## 📎 참고할만한 자료 (선택)
```

**refactor:**

```markdown
## #️⃣ 작업 내용

{설명}

## #️⃣ 작업이 필요한 이유

{이유}

## #️⃣ 작업 상세 내용

- [ ] TODO

## 📎 참고 자료 (선택)
```

### gh 명령어

```bash
# 내 이슈 목록 조회
gh issue list --assignee @me --repo OWNER/REPO --json number,title

# 이슈 생성 (라벨은 0단계에서 존재 확인된 경우에만 추가)
gh issue create --title "[FEAT] 설명" --body-file body.md --repo OWNER/REPO --assignee @me --label feature
```

---

## 2. 브랜치 (Branch)

### 네이밍 컨벤션

```
[type]/#[이슈번호]-[내용]
```

예: `feature/#12-melonds-wasm-build`

### type 매핑

커밋 prefix브랜치 type`feat`, `featurefeaturefixfixrefactorrefactortesttestchore`, `stylechore`

### 규칙

- 내용은 커밋 메시지에서 파싱: `[feat] 설명` → type=feat, desc=설명
- 한글 → 영문 슬러그로 대체
- 특수문자 sanitize, 최대 40자
- 동일 이슈 번호의 기존 브랜치가 있으면 checkout

### gh 명령어

```bash
# 이슈에 연결된 브랜치 생성 (우선)
gh issue develop 12 --repo OWNER/REPO --name feature/#12-desc --checkout

# fallback: 로컬 브랜치 (BASE_BRANCH는 0단계에서 감지한 값)
git checkout -b feature/#12-desc origin/BASE_BRANCH
```

---

## 3. 커밋 (Commit)

### 메시지 형식

```
[type] 설명

- 세부 변경 항목 1
- 세부 변경 항목 2

IssueNum #이슈번호
```

### 규칙

- 파일 목록이 있으면: `git add -- file1 file2`
- 없으면: `git add .`
- 변경사항 없으면 건너뜀 (`git diff --cached --quiet`)
- 락파일(`pnpm-lock.yaml`, `package-lock.json`, `yarn.lock` 등) 감지 시 경고
- 커밋 메시지, 이슈 제목, PR 제목/본문에 `—` (em dash) 사용 금지 → `-` (hyphen) 사용
- 커밋 메시지에 `Co-authored-by`, `Generated with`, `🤖` 등 AI 공동작성자 표기 금지 (커밋 메시지는 위 [메시지 형식](#%EB%A9%94%EC%8B%9C%EC%A7%80-%ED%98%95%EC%8B%9D)만 사용)

### Push

```bash
git push --set-upstream origin 브랜치명
```

- 실패 시 3회 재시도 (3초 간격)

- base 브랜치가 remote에 없으면 먼저 push:

  ```bash
  git push origin BASE_BRANCH:refs/heads/BASE_BRANCH
  ```

---

## 4. PR (Pull Request)

### 제목 형식

```
[TYPE] 설명
```

### 기본 템플릿

레포에 자체 PR 템플릿이 없을 때만 사용.

```markdown
## #️⃣ 연관된 이슈

- closes #이슈번호

## #️⃣ 작업 내용

{커밋 메시지 / 작업 설명}

## #️⃣ 테스트 결과

{테스트 결과 요약}

## #️⃣ 변경 사항 체크리스트

- [ ] 코드에 영향이 있는 모든 부분에 대한 테스트를 작성하고 실행했나요?
- [ ] 문서를 작성하거나 수정했나요? (필요한 경우)
- [ ] 코드 컨벤션에 따라 코드를 작성했나요?
- [ ] 본 PR에서 발생할 수 있는 모든 의존성 문제가 해결되었나요?

## #️⃣ 스크린샷 (선택)

## #️⃣ 리뷰 요구사항 (선택)

## 📎 참고 자료 (선택)
```

### 라벨

- PR에 연결된 이슈와 동일한 라벨을 붙인다 (단, 0단계에서 해당 라벨이 레포에 존재함을 확인한 경우에만)

### gh 명령어

```bash
gh pr create \
  --title "[FEAT] 설명" \
  --body-file pr_body.md \
  --base BASE_BRANCH \
  --repo OWNER/REPO \
  --assignee @me \
  --label feature
```

### PR 생성 후

- 연결된 이슈 본문에 `**연관된 PR:** #PR번호` 자동 추가:

  ```bash
  gh issue edit 12 --repo OWNER/REPO --body-file updated_body.md
  ```

---

## 5. 머지 (Merge)

### 메시지 형식

git이 만들어주는 기본 메시지(`Merge branch 'main' into feature/#12-desc`)를 **그대로 쓰지 않는다.** 커밋과 같은 규칙으로 prefix를 붙인다.

```
[merge] 설명

- 세부 변경 항목 1
- 세부 변경 항목 2

IssueNum #이슈번호
```

- 제목 한 줄은 "무엇을 어디에 합쳤는지"로 쓴다: `[merge] main을 feature/#12-desc에 반영`
- 충돌을 해결한 머지라면 **어느 파일에서 어느 쪽을 택했는지**를 본문에 남긴다. 나중에 그 선택을 되짚을 수 있는 유일한 기록이다.
- 3단계 [커밋 규칙](#3-%EC%BB%A4%EB%B0%8B-commit)을 그대로 따른다 - `—` (em dash) 금지, AI 공동작성자 표기 금지.

### 규칙

- `git merge --no-edit` 금지. 기본 메시지가 그대로 박힌다.
- 충돌이 없으면 `-m`으로 메시지를 직접 준다.
- 충돌이 있으면 해결한 뒤 `git commit -F`로 파일에서 읽어 넣는다 (여러 줄 본문이 셸 인용으로 깨지지 않는다).
- **PR을 머지할 때는 `[merge]`를 쓰지 않는다.** 머지 커밋 제목은 PR 제목 그대로 (`[FEAT] 설명 (#PR번호)`)로 한다. `gh pr merge --merge`의 기본 제목(`Merge pull request #N from ...`)은 `--subject`로 PR 제목에 `(#N)`을 붙여 덮어쓴다. `[merge]` 형식은 base 브랜치(또는 이전 작업 브랜치)를 **작업 브랜치로 가져와 반영할 때**만 쓴다.

```bash
# 충돌 없는 머지
git merge origin/BASE_BRANCH -m "[merge] BASE_BRANCH를 feature/#12-desc에 반영"

# 충돌을 해결한 머지
git commit -F merge_msg.txt

# PR 머지 (제목은 PR 제목 그대로)
gh pr merge 12 --repo OWNER/REPO --merge --subject "[FEAT] 설명 (#12)" --body "- 세부 변경 항목"
```

---

## 브랜치 전환 안전 규칙

### 반드시 커밋 후 전환

변경사항이 있는 상태에서 브랜치를 전환하면 데이터가 유실될 수 있다. **절대 금지 패턴:**

```bash
# 위험: 커밋 안 된 변경이 있는데 브랜치 전환
git checkout other-branch        # overwrite 경고
git stash && git checkout ...    # stash pop 시 충돌 → git clean 하면 끝
```

### 안전 패턴

```bash
# 1. 먼저 현재 변경사항을 커밋 (임시 커밋 OK)
git add -A && git commit -m "[wip] 임시 저장"

# 2. 그 다음 브랜치 전환 (BASE_BRANCH는 0단계에서 감지한 값)
git checkout BASE_BRANCH && git pull origin BASE_BRANCH

# 3. 새 브랜치 생성 + cherry-pick
git checkout -b feature/#N-desc BASE_BRANCH
git cherry-pick <임시커밋해시>
```

### base 브랜치 최신화 + feature 브랜치 생성

```bash
# base 브랜치를 최신으로
git fetch origin BASE_BRANCH
git checkout BASE_BRANCH
git pull origin BASE_BRANCH

# feature 브랜치를 base 브랜치 기반으로 생성
git checkout -b feature/#N-desc BASE_BRANCH
```

### 금지 명령어

명령어위험대안`git clean -fd`untracked 파일 영구 삭제`git stash -ugit checkout -- .`커밋 안 된 수정 영구 삭제`git stashgit stash drop`stash 영구 삭제stash 적용 확인 후 삭제`git reset --hard`커밋 안 된 모든 변경 삭제`git reset --soft`

---

## 초기화 (git/remote 없는 경우)

1. `git init`
2. remote 없으면:
   - `gh repo create 레포명 --private --source . --push`
   - 또는 `git remote add origin URL`
3. 커밋 없으면: `git commit --allow-empty -m "init"` → push
4. 기존 레포: `git fetch origin`
5. 초기화 완료 후 [0단계](#0-%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8-%EC%A0%95%EB%B3%B4-%EC%9E%90%EB%8F%99-%EA%B0%90%EC%A7%80-%ED%94%8C%EB%A1%9C%EC%9A%B0-%EC%8B%9C%EC%9E%91-%EC%A0%84-%ED%95%84%EC%88%98)로 돌아가 owner/repo, base 브랜치를 다시 감지
