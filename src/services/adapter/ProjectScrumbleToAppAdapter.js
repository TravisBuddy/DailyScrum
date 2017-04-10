// @flow
import type { ProjectType } from '../../types';
import type { ScrumbleProjectType } from '../../types/Scrumble';

export default (project: ScrumbleProjectType): ProjectType => {
  return {
    id: project.id,
    boardId: project.boardId,
    name: project.name,
    columnMapping: project.columnMapping,
  };
};
