
pushd types
call pnpm build
popd

pushd client
call pnpm build
popd

pushd engine
call pnpm build
popd

pushd server
call pnpm build
popd

pushd webapp
call pnpm build
popd