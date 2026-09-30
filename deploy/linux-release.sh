#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
AWS_PROFILE=${AWS_PROFILE:-codex-login}
AWS_REGION=${AWS_REGION:-us-east-1}
ONCE_STACK=${ONCE_STACK:-once-demo-service-v2}
ONCE_BUILD_STACK=${ONCE_BUILD_STACK:-once-demo-build}
ONCE_IMAGE_TAG=${ONCE_IMAGE_TAG:-demo-$(date -u +%Y%m%d-%H%M%S)}
ONCE_TEST_PORT=${ONCE_TEST_PORT:-3002}
AWS_CLI=${AWS_CLI:-aws}
if ! command -v "$AWS_CLI" >/dev/null && [[ -x "$HOME/.local/bin/aws" ]]; then
  AWS_CLI="$HOME/.local/bin/aws"
fi
aws_once() {
  "$AWS_CLI" "$@" --profile "$AWS_PROFILE" --region "$AWS_REGION" --no-cli-pager
}
for program in docker npm curl; do command -v "$program" >/dev/null; done
docker info >/dev/null
mkdir -p artifacts/release
aws_once sts get-caller-identity > artifacts/release/aws-identity.json
aws_once cloudformation describe-stacks --stack-name "$ONCE_BUILD_STACK" \
  --query 'Stacks[0].Outputs' > artifacts/release/build-stack-outputs.json
repository=$(aws_once cloudformation describe-stacks --stack-name "$ONCE_BUILD_STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='RepositoryUri'].OutputValue | [0]" --output text)
[[ "$repository" != None && "$repository" == *.dkr.ecr.*.amazonaws.com/* ]]
image="$repository:$ONCE_IMAGE_TAG"
registry=${repository%%/*}
repository_name=${repository#*/}
temporary=$(mktemp -d /tmp/once-release.XXXXXX)
container=""
cleanup() {
  if [[ -n "$container" ]]; then
    docker stop "$container" >/dev/null 2>&1 || true
    docker rm "$container" >/dev/null 2>&1 || true
  fi
  docker --config "$temporary" logout "$registry" >/dev/null 2>&1 || true
}
trap cleanup EXIT

npm ci
npm run typecheck
npm test
npm run build
npm audit
docker build --network "${ONCE_BUILD_NETWORK:-default}" -t "$image" .
container=$(docker run -d -p "127.0.0.1:$ONCE_TEST_PORT:3001" "$image")
local_origin="http://127.0.0.1:$ONCE_TEST_PORT"
for ((attempt=1; attempt<=30; attempt++)); do
  if curl -fsS "$local_origin/api/health" > artifacts/release/container-health.json; then break; fi
  sleep 1
done
ONCE_API_ORIGIN="$local_origin" npm run smoke
docker run --rm --network host --user "$(id -u):$(id -g)" \
  -e "ONCE_API_ORIGIN=$local_origin" -v "$PWD:/app" -w /app \
  mcr.microsoft.com/playwright:v1.63.0-noble npm run smoke:recording
docker cp "$container:/app/.data" artifacts/release/container-data
docker stop "$container" >/dev/null
docker rm "$container" >/dev/null
container=""

# The short-lived ECR token passes directly to Docker; it never appears in logs.
aws_once ecr get-login-password | docker --config "$temporary" login \
  --username AWS --password-stdin "$registry"
docker --config "$temporary" push "$image"
docker --config "$temporary" logout "$registry"
aws_once ecr describe-images --repository-name "$repository_name" \
  --image-ids "imageTag=$ONCE_IMAGE_TAG" > artifacts/release/ecr-image.json
printf '%s\n' "$image" > artifacts/release/image-uri.txt
aws_once cloudformation validate-template --template-body file://deploy/service-stack.yml \
  > artifacts/release/template-validation.json
if command -v cfn-lint >/dev/null; then
  cfn-lint --format json --regions "$AWS_REGION" --template deploy/service-stack.yml \
    > artifacts/release/cfn-lint.json
fi
aws_once cloudformation deploy --template-file deploy/service-stack.yml \
  --stack-name "$ONCE_STACK" --capabilities CAPABILITY_IAM \
  --parameter-overrides "ImageUri=$image"
aws_once cloudformation describe-stacks --stack-name "$ONCE_STACK" \
  --query 'Stacks[0].Outputs' > artifacts/release/service-outputs.json
public_url=$(aws_once cloudformation describe-stacks --stack-name "$ONCE_STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='PublicUrl'].OutputValue | [0]" --output text)
[[ "$public_url" == https://* ]]
curl -fsS "$public_url/api/health" > artifacts/release/public-health.json
ONCE_API_ORIGIN="$public_url" npm run smoke
docker run --rm --network host --user "$(id -u):$(id -g)" \
  -e "ONCE_API_ORIGIN=$public_url" -v "$PWD:/app" -w /app \
  mcr.microsoft.com/playwright:v1.63.0-noble npm run smoke:recording
printf 'Verified public smoke and recording flow: %s\n' "$public_url"
printf 'Next: inspect the image scan, record the live walkthrough, and publish the reviewed submission.\n'
