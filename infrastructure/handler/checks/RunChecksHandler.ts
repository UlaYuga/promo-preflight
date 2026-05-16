import type { CommandHandler, Result } from '../../../application/bus/types';
import type { RunChecksCommand } from '../../../application/command/RunChecksCommand';
import type { Run } from '../../../domain/model/Run';
import type { PreflightException } from '../../../domain/exception/PreflightException';
import { RunChecksUseCase } from '../../../application/usecase/RunChecksUseCase';
import { FormatQaCheck } from '../../checks/FormatQaCheck';
import { LinkQaCheck } from '../../checks/LinkQaCheck';
import { PaymentCompatibilityCheck } from '../../checks/PaymentCompatibilityCheck';
import { CryptoDisclosureCheck } from '../../checks/CryptoDisclosureCheck';
import { JurisdictionalRiskCheck } from '../../checks/JurisdictionalRiskCheck';

export const handler: CommandHandler<RunChecksCommand, Run> = {
  commandType: 'RunChecks',
  async execute(command: RunChecksCommand): Promise<Result<Run, PreflightException>> {
    const useCase = new RunChecksUseCase([
      FormatQaCheck,
      LinkQaCheck,
      PaymentCompatibilityCheck,
      CryptoDisclosureCheck,
      JurisdictionalRiskCheck,
    ]);
    return useCase.run(command.campaign, command.options);
  },
};
