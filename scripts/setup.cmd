pushd client
call pnpm link -g
popd

pushd engine
call pnpm link -g
popd

pushd types
call pnpm link -g
popd

pushd client
call pnpm link -g @roadblocks/types
popd

pushd engine
call pnpm link -g @roadblocks/types
popd

pushd server
call pnpm link -g @roadblocks/types
call pnpm link -g @roadblocks/engine
popd

pushd webapp
call pnpm link -g @roadblocks/types
call pnpm link -g @roadblocks/client
popd

:-----------------------------

pushd types
call pnpm install
popd

pushd client
call pnpm install
popd

pushd engine
call pnpm install
popd

pushd server
call pnpm install
popd

pushd webapp
call pnpm install
popd