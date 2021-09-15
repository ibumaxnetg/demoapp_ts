// Drag & Drop
interface Draggable {
  dragStartHandler(event: DragEvent): void;
  dranEndHandler(event: DragEvent): void;
}

interface DragTarget {
  dragOverHandler(event: DragEvent): void;
  dropHandler(event: DragEvent): void;
  dragLeaveHandler(event: DragEvent): void;
}

interface Validatable {
  value: string | number;
  required?: boolean;
  maxlength?: number;
  minlength?: number;
  max?: number;
  min?: number;
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

type Listener = (items: Project[]) => void;








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

// function validate( validatableInput: Validatable) {
function validate(validatableInput: Validatable) {
  let isValid = true;
  if (validatableInput.required) {
    isValid = isValid && validatableInput.value.toString().trim().length !== 0;
  }
  if(validatableInput.minlength != null && typeof validatableInput.value === 'string') {
    isValid = isValid && validatableInput.value.length >= validatableInput.minlength;
  }
  if(validatableInput.maxlength != null && typeof validatableInput.value === 'string') {
    isValid = isValid && validatableInput.value.length <= validatableInput.maxlength;
  }
  if(validatableInput.min != null && typeof validatableInput.value === 'number') {
    isValid = isValid && validatableInput.value <= validatableInput.min && validatableInput.value !== 0;
  }
  if(validatableInput.max != null && typeof validatableInput.value === 'number') {
    isValid = isValid && validatableInput.value <= validatableInput.max && validatableInput.value !== 0;
  }

  return isValid;
}




class ProjectState {
  private static instance: ProjectState;
  private projectsArr: Project[] = [];
  private projectListeners: Listener[] = [];

  private constructor() {}

  addProject(titleTx: string, descTx: string, mandayTx:number) {
    const newProject = new Project(
      Math.random().toString(),
      titleTx,
      descTx,
      mandayTx,
      ProjectStatus.Active,
    );

    this.projectsArr.push(newProject);
    for (const listenerFn of this.projectListeners) {
      listenerFn(this.projectsArr.slice());
      // console.log("listenerFn:だよ", listenerFn);
    }
  }

  addListener(listenerFn: Listener) {
    this.projectListeners.push(listenerFn);
  }

  static getInstance() {
    if(!ProjectState.instance) {
      ProjectState.instance = new ProjectState;
    }
    return ProjectState.instance;
  }
}


class ProjectItem {
  baseElements: HTMLTemplateElement;
  outputElements: HTMLDivElement;
  editElements: HTMLLIElement;

  private project: Project;

  constructor(public getProject: Project, public hostId: string) {
    this.project = getProject;

    this.baseElements = document.getElementById('single-project')! as HTMLTemplateElement;
    this.outputElements = document.getElementById(hostId)! as HTMLDivElement;

    const addNode = document.importNode(this.baseElements.content, true);
    this.editElements = addNode.firstElementChild as HTMLLIElement;

    if (this.project.id) {
      this.editElements.id = this.project.id;
    }

    this.attach();
    this.renderContet();
  }

  renderContet() {
    this.editElements.querySelector('h2')!.textContent = this.project.title;
    this.editElements.querySelector('h3')!.textContent = this.project.description;
    this.editElements.querySelector('p')!.textContent = String(this.project.manday);
  }

  attach() {
    this.outputElements.insertAdjacentElement('afterbegin', this.editElements);
  }
}


class ProjectList {
  baseElements: HTMLTemplateElement;
  outputElements: HTMLDivElement;
  editElements: HTMLElement;

  assignedProjects: Project[];

  constructor(private stateType: 'active' | 'finished') {
    this.assignedProjects = [];
    this.outputElements = document.getElementById('app')! as HTMLDivElement;
    this.baseElements = document.getElementById('project-list')! as HTMLTemplateElement;

    const addNode = document.importNode(this.baseElements.content, true);
    this.editElements = addNode.firstElementChild! as HTMLElement;
    this.editElements.id = `${this.stateType}-projects`;

    prjState.addListener((projects: Project[]) => {
      const relevantProjects = projects.filter((prj) => {
        if(stateType === 'active') {
          return prj.status === ProjectStatus.Active;
        }
        return prj.status === ProjectStatus.Finished;
      });
      this.assignedProjects = relevantProjects;
      // console.log("asignedProject:", relevantProjects);
      this.renderProject();
    });

    this.attach();
    this.configure();
    this.renderContent();
  }

  private renderContent() {
    const listEl = `${this.stateType}-projects-list`;
    this.editElements.querySelector('ul')!.id = listEl;
    this.editElements.querySelector('h2')!.textContent = this.stateType === 'active' ? '実行中オブジェクト': '完了プロジェクト';
  }

  private renderProject() {
    const addElement = document.getElementById(`${this.stateType}-projects-list`)! as HTMLUListElement;
    addElement.innerHTML = '';
    this.assignedProjects.forEach((prj) => {
      // const addItem = document.createElement('li');
      // addItem.id = prj.id;
      // addItem.textContent = prj.title;
      // addElement.appendChild(addItem);
      new ProjectItem(prj, addElement.id);
    });
      // console.log("render :", this.assignedProjects);
  }


  configure() {

  }

  attach() {
    this.outputElements.insertAdjacentElement('afterbegin', this.editElements);
  }
}


class ProjectInput {
  baseElements: HTMLTemplateElement;
  outputElements: HTMLDivElement;
  editElements: HTMLFormElement;

  ttlInputElement: HTMLInputElement;
  descInputElement: HTMLInputElement;
  mdInputElement: HTMLInputElement;

  constructor() {
    this.outputElements = document.getElementById('app')! as HTMLDivElement;
    this.baseElements = document.getElementById('project-input')! as HTMLTemplateElement;

    const addNode = document.importNode(this.baseElements.content, true);
    this.editElements = addNode.firstElementChild! as HTMLFormElement;
    this.editElements.id = 'user-input';

    this.ttlInputElement = this.editElements.querySelector('#title')! as HTMLInputElement;
    this.descInputElement = this.editElements.querySelector('#description')! as HTMLInputElement;
    this.mdInputElement = this.editElements.querySelector('#manday')! as HTMLInputElement;

    this.configure();
    this.attach();
  }

  @autobind
  private submitHandler(event: Event) {
    event.preventDefault();
    const userInput = this.gatherUserInput();
    if (Array.isArray(userInput)) {
      const [title, description, manday] = userInput;
    // console.log(userInput);
      prjState.addProject(title, description, manday);
      this.clearInput();
    }
  }

  private gatherUserInput(): [string, string, number] | void {
    const enterTtl = this.ttlInputElement.value;
    const enterDesc = this.descInputElement.value;
    const enterMd = this.mdInputElement.value;
    // console.log(enterTtl, enterDesc, enterMd);

    const validTtl: Validatable = {
      value: enterTtl,
      required: true
    }
    const validDesc: Validatable = {
      value: enterDesc,
      required: true,
      minlength: 3
    }
    const validMd: Validatable = {
      value: Number(enterMd),
      required: true,
      max: 999
    }

    if (
      !validate(validTtl) ||
      !validate(validDesc) ||
      !validate(validMd)
    ) {
      alert("文字が正しくありません");
    return;
    } else {
      return [enterTtl, enterDesc, +enterMd];
    }

  }

  private clearInput() {
    this.ttlInputElement.value = '';
    this.descInputElement.value = '';
    this.mdInputElement.value = '';
  }

  configure() {
    this.editElements.addEventListener('submit', this.submitHandler);
  }

  attach() {
    this.outputElements.insertAdjacentElement('afterbegin', this.editElements)
  }

}

const prjState = ProjectState.getInstance();
const actvPrjList = new ProjectList('active');
const finsPrjList = new ProjectList('finished');
const prjInput = new ProjectInput();
