// Drag & Drop
interface Draggable {
  dragStartHandler(event: DragEvent): void;
  dragEndHandler(event: DragEvent): void;
}

interface DragTarget {
  dragOverHandler(event: DragEvent): void;
  dropHandler(event: DragEvent): void;
  dragLeaveHandler(event: DragEvent): void;
}

class Project {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public manday: number,
    public status: ProjectStatus,
  ) {}
}

enum ProjectStatus {
  Active,
  Finished,
}

interface Validatable {
  value: string | number,
  required?: boolean,
  maxLength?: number,
  minLength?: number,
  max?: number,
  min?: number,
}
// abstract class Component {

//   constructor(
//   ) {
//   }

// }

type ListenerFn = (item: Project[]) => void;












// autobind decoretor
function autobind(_target: any, _methodName: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  const acjDescriptor: PropertyDescriptor = {
    configurable: true,
    get() {
      const boundFn = originalMethod.bind(this);
      return boundFn;
    }
  };
  return acjDescriptor;
}

function validate(inputValid: Validatable) {
  let isValid = true;
  if (inputValid.required) {
    isValid = isValid && inputValid.value.toString().trim().length !== 0;
    isValid = isValid && inputValid.value !== 0;
    console.log(inputValid.value, isValid, 'required', inputValid.value.toString().trim().length, '文字');
  }
  if (inputValid.maxLength && typeof inputValid.value === 'string') {
    isValid = isValid && inputValid.value.length < inputValid.maxLength;
    console.log(inputValid.value, isValid, 'maxLength', inputValid.maxLength, '<', inputValid.value.length, '文字');
  }
  if (inputValid.minLength && typeof inputValid.value === 'string') {
    isValid = isValid && inputValid.value.length > inputValid.minLength;
    console.log(inputValid.value, isValid, 'minLength', inputValid.minLength, '>', inputValid.value.length, '文字');
  }
  if (inputValid.max && typeof inputValid.value === 'number') {
    isValid = isValid && inputValid.value < inputValid.max;
    console.log(inputValid.value, isValid, 'max');
  }
  if (inputValid.min && typeof inputValid.value === 'number') {
    isValid = isValid && inputValid.value > inputValid.min;
    console.log(inputValid.value, isValid, 'min');
  }

  return isValid;
}















class ProjectState {
  projectsContainer: Project[] = [];
  projectListeners: ListenerFn[] = [];
  constructor() {}

  addProject(titleTxt: string, descriptionTxt: string, mandayTxt: number) {
    const newProject = new Project(
      Math.random().toString(),
      titleTxt,
      descriptionTxt,
      mandayTxt,
      ProjectStatus.Active,
    );
    this.projectsContainer.push(newProject);
    this.updateListeners();
  }

  addListener(listener: ListenerFn) {
    this.projectListeners.push(listener);
  }

  moveProject(moveId: string, dropStatus: 'active' | 'finished') {
    const changeProject = this.projectsContainer.find((project) => moveId === project.id);
    if (changeProject) {
      changeProject.status = dropStatus === 'active' ? ProjectStatus.Active : ProjectStatus.Finished;
    }
    this.updateListeners();
  }

  private updateListeners() {
    for (const listenerFn of this.projectListeners) {
      listenerFn(this.projectsContainer.slice());
    }
  }

}





class ProjectInput {
  baseElements: HTMLTemplateElement;
  outputElements: HTMLDivElement;
  editElements: HTMLFormElement;

  inputTtlElement: HTMLInputElement;
  inputDescElement: HTMLInputElement;
  inputMdElement: HTMLInputElement;

  constructor(
    private tempId = 'project-input',
    private dispId = 'app',
    private attachAt: boolean = true,
    private editEltId = 'user-input',
  ) {
    this.baseElements = document.getElementById(this.tempId) ! as HTMLTemplateElement;
    this.outputElements = document.getElementById(this.dispId) ! as HTMLDivElement;

    const baseNode = document.importNode(this.baseElements.content, true);
    this.editElements = baseNode.firstElementChild! as HTMLFormElement;
    this.editElements.id = this.editEltId;

    this.inputTtlElement = this.editElements.querySelector('#title') as HTMLInputElement;
    this.inputDescElement = this.editElements.querySelector('#description') as HTMLInputElement;
    this.inputMdElement = this.editElements.querySelector('#manday') as HTMLInputElement;

    this.configure();
    this.renderContent();
    this.attach(this.attachAt);
  }

  @autobind
  private submitHandler(event: Event) {
    event.preventDefault();
    const userInput = this.gatherUserInput();
    if (Array.isArray(userInput)) {
      const [title, description, manday] = userInput;
      prjState.addProject(title, description, manday);
      this.clearInputs();
    }
  }

  private gatherUserInput(): [string, string, number] | void {
    const inputTitleTxt = this.inputTtlElement.value;
    const inputDexcTxt = this.inputDescElement.value;
    const inputMdTxt = Number(this.inputMdElement.value);

    const validiptTtl = {
      value: inputTitleTxt,
      required: true,
      maxLength: 22,
      minLength: 2,
    }

    const validiptDesc = {
      value: inputDexcTxt,
      required: true,
      maxLength: 222,
      minLength: 2,
    }

    const validiptmd = {
      value: inputMdTxt,
      required: true,
      min: 1,
      max: 100000,
    }

    if (
      validate(validiptTtl) &&
      validate(validiptDesc) &&
      validate(validiptmd)
    ) {
      return [inputTitleTxt, inputDexcTxt, Number(inputMdTxt)];
    } else {
      alert('入力値が正しくありません');
      return;
    }
  }

  private clearInputs() {
    this.inputTtlElement.value = '';
    this.inputDescElement.value = '';
    this.inputMdElement.value = '';
  }

  private configure() {
    this.editElements.addEventListener('submit', this.submitHandler)
  }

  private renderContent() {}

  private attach(insertAt: boolean) {
    this.outputElements.insertAdjacentElement(insertAt === true ? 'afterbegin' : 'beforeend', this.editElements);
  }
}



class ProjectList implements DragTarget {
  baseElements: HTMLTemplateElement;
  outputElements: HTMLElement;
  editElements: any;

  assignedProjects: Project[];

  constructor(
    private listType: 'active' | 'finished',
    private tempId = 'project-list',
    private dispId = 'app',
    private attachAt: boolean = false,
    private editEltId = `${listType}-projects`,
  ) {
    this.baseElements = document.getElementById(this.tempId)! as HTMLTemplateElement;
    this.outputElements = document.getElementById(this.dispId)! as HTMLElement;

    const baseNode = document.importNode(this.baseElements.content, true);
    this.editElements = baseNode.firstElementChild! as HTMLElement;
    this.editElements.id = this.editEltId;

    this.assignedProjects = [];

    this.configure();
    this.renderContent();
    this.attach(this.attachAt);
  }

  @autobind
  dragOverHandler(event: DragEvent): void {
    if (event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
      event.preventDefault();
      const dropArea = this.editElements.querySelector(`#${this.listType}-projects-list`)!;
      // console.log('dragOverHandler', dropArea, this.listType);
      dropArea.classList.add('droppable');
    }
  }

  @autobind
  dropHandler(event: DragEvent): void {
    event.preventDefault();
    const moveId = event.dataTransfer!.getData('text/plain');
    const dropArea = this.editElements.querySelector(`#${this.listType}-projects-list`)!;
    // console.log('dropHandler', dropArea, this.listType);
    dropArea.classList.remove('droppable');
    prjState.moveProject(moveId, this.listType);
  }

  @autobind
  dragLeaveHandler(_event: DragEvent): void {
    const dropArea = this.editElements.querySelector(`#${this.listType}-projects-list`)!;
    // console.log('dragLeaveHandler', dropArea, this.listType);
    dropArea.classList.remove('droppable');
  }

  private renderContent() {
    const titleEl = this.editElements.querySelector('h2') !;
    const listEl = this.editElements.querySelector('ul');
    titleEl.textContent = this.listType === 'active' ? '稼働中プロジェクト' : '完了プロジェクト';
    listEl.id = `${this.listType}-projects-list`;
  }

  private renderProject() {
    const dispUlEl = document.querySelector(`#${this.listType}-projects-list`)!;
    dispUlEl.innerHTML = '';
    this.assignedProjects.forEach((project) => {
      new ProjectItem(dispUlEl.id, project);
    });
  }

  private configure() {
    this.editElements.addEventListener('dragover', this.dragOverHandler);
    this.editElements.addEventListener('drop', this.dropHandler);
    this.editElements.addEventListener('dragleave', this.dragLeaveHandler);

    prjState.addListener((projects: Project[]) => {
      const filProject = projects.filter((project) => {
        if (this.listType === 'active') {
          return project && project.status === ProjectStatus.Active;
        }
        return project && project.status === ProjectStatus.Finished;
      });
      this.assignedProjects = filProject;
      this.renderProject();
    });
  }

  private attach(insertAt: boolean) {
    this.outputElements.insertAdjacentElement(insertAt === true ? 'afterbegin' : 'beforeend', this.editElements);
  }
}




class ProjectItem implements Draggable {
  baseElements: any;
  outputElements: any;
  editElements: any;

  project: Project;

  constructor(
    public ulId: string,
    private projectItem: Project,
    private tempId = 'single-project',
    private dispId = ulId,
    private attachAt: boolean = true,
    private editEltId = projectItem.id,
  ) {
    this.project = this.projectItem;

    this.baseElements = document.getElementById(this.tempId)! as HTMLTemplateElement;
    this.outputElements = document.getElementById(this.dispId)! as HTMLUListElement;

    const baseNode = document.importNode(this.baseElements.content, true);
    this.editElements = baseNode.firstElementChild! as HTMLLIElement;
    this.editElements.id = this.editEltId;
    this.editElements.draggable = true;

    this.configure();
    this.renderContent();
    this.attach(this.attachAt);
  }

  @autobind
  dragStartHandler(event: DragEvent): void {
    event.dataTransfer!.setData('text/plain', this.editEltId);
    event.dataTransfer!.effectAllowed = 'move';
    // console.log(event.dataTransfer!.getData('text/plain'));
  }

  dragEndHandler(_event: DragEvent): void {
    // console.log('dragend');
  }

  private get mandaychk() {
    if (this.project.manday && this.project.manday > 20) {
      return this.project.manday / 20 + '人月';
    }
    return this.project.manday + '人日';
  }

  private configure() {
    this.editElements.addEventListener('dragstart', this.dragStartHandler);
    this.editElements.addEventListener('dragend', this.dragEndHandler);
  }

  private renderContent() {
    const createH2 = document.createElement('h2');
    const createH3 = document.createElement('h3');
    const createP = document.createElement('p');
    createH2.textContent = this.project.title;
    createH3.textContent = this.project.description;
    createP.textContent = this.mandaychk;

    this.editElements.appendChild(createH2);
    this.editElements.appendChild(createH3);
    this.editElements.appendChild(createP);
  }

  private attach(insertAt: boolean) {
    this.outputElements.insertAdjacentElement(insertAt === true ? 'afterbegin' : 'beforeend', this.editElements);
  }
}




const prjState = new ProjectState();
const actvPrjList = new ProjectList('active');
const finsPrjList = new ProjectList('finished');
const prjInput = new ProjectInput();
