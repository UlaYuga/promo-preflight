import type { CommandHandler, HandlerContext, Result } from '../../../application/bus/types';
import type { RunChecksCommand } from '../../../application/command/RunChecksCommand';
import type { Run } from '../../../domain/model/Run';
import type { PreflightException } from '../../../domain/exception/PreflightException';
import { RunChecksUseCase } from '../../../application/usecase/RunChecksUseCase';

export const handler: CommandHandler<RunChecksCommand, Run> = {
  commandType: 'RunChecks',
  async execute(command: RunChecksCommand, _ctx: HandlerContext): Promise<Result<Run, PreflightException>> {
    const useCase = new RunChecksUseCase();
    return useCase.run(command.campaign, command.options);
  },
};
