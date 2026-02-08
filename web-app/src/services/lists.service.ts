import {
  listsService as frontendListsService,
  ToDoList,
  CreateToDoListDto,
  UpdateToDoListDto,
} from '@tasks-management/frontend-services';

class ListsService {
  async getAllLists(): Promise<ToDoList[]> {
    return frontendListsService.getAll();
  }

  async getListById(id: string | number): Promise<ToDoList> {
    return frontendListsService.getById(id);
  }

  async createList(data: CreateToDoListDto): Promise<ToDoList> {
    return frontendListsService.create(data);
  }

  async updateList(
    id: string | number,
    data: UpdateToDoListDto
  ): Promise<ToDoList> {
    return frontendListsService.update(id, data);
  }

  async deleteList(id: string | number): Promise<ToDoList> {
    return frontendListsService.delete(id);
  }
}

export const listsService = new ListsService();
