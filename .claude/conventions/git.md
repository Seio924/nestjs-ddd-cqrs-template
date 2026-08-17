# Git 전략

## 브랜치 모델

| 브랜치 | 역할 | 분기 → 병합 |
|---|---|---|
| `main` | 항상 배포 가능 | — |
| `feature/*` | 기능 개발 | main → main |
| `fix/*` | 버그 수정 | main → main |
| `refactor/*` `chore/*` `docs/*` `test/*` | 그 외 작업 | main → main |

- 브랜치명: `<type>/<간단한-설명-kebab>` (예: `feature/article-publish`, `fix/lint-error`).
- 팀·스테이징 서버가 생기면 `develop`(통합) + `release/*`를 얹어 Git Flow로 확장할 수 있다.

## 커밋 컨벤션 (Conventional Commits)

```
<type>(<scope>)<!>: <요약>

<본문(선택): 무엇을·왜>

<footer(선택): BREAKING CHANGE: ... / Closes #123>
```

- **요약**: 명령형, 마침표 없이, 50자 내외.
- **scope**(선택): 도메인/영역(`article`, `auth`).

| type | 의미 | SemVer |
|---|---|---|
| `feat` | 새 기능 | MINOR |
| `fix` | 버그 수정 | PATCH |
| `perf` | 성능 개선 | PATCH |
| `refactor` | 동작 변화 없는 구조 개선 | — |
| `docs` `test` `chore` `style` `ci` `build` | 문서/테스트/잡무 등 | — |

- **브레이킹 = MAJOR**: `type!:` 또는 footer `BREAKING CHANGE: <설명>`.

## 병합 전략

- **feature/fix → main: Squash merge.** PR당 커밋 1개로 눌러 히스토리를 깔끔하게.
- Squash로 합쳐질 커밋이라도 **리뷰 중에는 커밋이 읽는 단위**다. PR 안에서도 `type(scope): 요약`을 지키고, 각 커밋이 빌드·lint 통과 상태를 유지한다.

## PR 단위 원칙 (🔴 중요)

**1 PR = 1 논리적 변경.** 작고 집중된 PR을 지향한다(리뷰·롤백·changelog 다 좋아짐).

- ✅ 좋음: "게시글 발행 기능"만 담은 PR → `feat(article): ...`
- ❌ 나쁨: 새 기능 + 무관한 버그 수정 + 리팩토링 섞기.
- 판단이 애매하면: "이 변경을 changelog에 **한 줄로** 적었을 때 정확한가?" → 아니면 쪼갠다.

## PR 플로우

1. `main`에서 작업 브랜치 분기.
2. 작업 → push → PR(base `main`).
3. PR 제목도 커밋 컨벤션 형식(`type(scope): 요약`).
4. CI(lint+test+build) 통과 후 **Squash merge**.

## 버전 관리 (선택)

- 릴리스가 필요해지면 **SemVer** + [release-please](https://github.com/googleapis/release-please) 같은 도구로 conventional 커밋 기반 자동 bump + CHANGELOG를 붙일 수 있다.
- API URL 버전은 전역 prefix `/v1`로 시작하고, 계약이 **브레이킹**될 때만 `/v2`를 병행한다.
