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

interface Validatable {
  value: string | number;
  required?: boolean;
  maxLength?: number;
  minLength?: number;
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

type Listener<T> = (items: T[]) => void;

class State<T> {
  protected projectListeners: Listener<T>[] = [];

  addListener(listenerFn: Listener<T>) {
    this.projectListeners.push(listenerFn);
  }
}

abstract class Component<T extends HTMLElement, U extends HTMLElement> {
  baseElements: HTMLTemplateElement;
  outputElements: T;
  editElements: U;

  constructor(
    tempId: string,
    outputId: string,
    interPosi: boolean,
    editId?: string,
  ) {
    this.baseElements = document.getElementById(tempId)! as HTMLTemplateElement;
    this.outputElements = document.getElementById(outputId)! as T;

    const addNode = document.importNode(this.baseElements.content, true);
    this.editElements = addNode.firstElementChild! as U;
    if (editId) {
      this.editElements.id = editId;
    }

    this.configure();
    this.attach(interPosi);
  }

  abstract configure(): void;
  abstract renderContent(): void;

  attach(insertAtBigining: boolean) {
    this.outputElements.insertAdjacentElement(insertAtBigining ? 'afterbegin': 'beforeend', this.editElements);
  }

}





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
    // console.log(isValid, validatableInput.value, "/", validatableInput.value.toString().trim().length);
  }
  if(validatableInput.minLength != null && typeof validatableInput.value === 'string') {
    isValid = isValid && validatableInput.value.length >= validatableInput.minLength;
  }
  if(validatableInput.maxLength != null && typeof validatableInput.value === 'string') {
    isValid = isValid && validatableInput.value.length <= validatableInput.maxLength;
  }
  if(validatableInput.min != null && typeof validatableInput.value === 'number') {
    isValid = isValid && validatableInput.value <= validatableInput.min && validatableInput.value !== 0;
    // console.log("min number:",validatableInput.value );
  }
  if(validatableInput.max != null && typeof validatableInput.value === 'number') {
    isValid = isValid && validatableInput.value <= validatableInput.max && validatableInput.value !== 0;
    // console.log("max number:",validatableInput.value );
  }

    // console.log("return", isValid, validatableInput);
  return isValid;
}




class ProjectState extends State<Project> {
  private static instance: ProjectState;
  private projectsArr: Project[] = [];

  private constructor() {
    super();
  }

  static getInstance() {
    if(!ProjectState.instance) {
      ProjectState.instance = new ProjectState;
    }
    return ProjectState.instance;
  }

  addProject(titleTx: string, descTx: string, mandayTx:number) {
    const newProject = new Project(
      Math.random().toString(),
      titleTx,
      descTx,
      mandayTx,
      ProjectStatus.Active,
    );

    this.projectsArr.push(newProject);
    // for (const listenerFn of this.projectListeners) {
    //   listenerFn(this.projectsArr.slice());
    //   // console.log("listenerFn:だよ", listenerFn);
    // }
        this.updateListeners();
  }

  moveProject(projectId: string, changeStatus: ProjectStatus) {
    const project = this.projectsArr.find((prj) => prj.id === projectId);
    if (project && project.status !== changeStatus) {
      project.status = changeStatus;
      this.updateListeners();
    }
  }

  private updateListeners() {
    for (const listenerFn of this.projectListeners) {
      listenerFn(this.projectsArr.slice());
    }
  }
}





class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {

  ttlInputElement: HTMLInputElement;
  descInputElement: HTMLInputElement;
  mdInputElement: HTMLInputElement;

  constructor() {
    super('project-input', 'app', true, 'user-input');
    this.ttlInputElement = this.editElements.querySelector('#title')! as HTMLInputElement;
    this.descInputElement = this.editElements.querySelector('#description')! as HTMLInputElement;
    this.mdInputElement = this.editElements.querySelector('#manday')! as HTMLInputElement;

    this.attach(true);
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
      required: true,
    }
    const validDesc: Validatable = {
      value: enterDesc,
      required: true,
      minLength: 3,
    }
    const validMd: Validatable = {
      value: Number(enterMd),
      required: true,
      max: 999,
    }

    if (
      !validate(validTtl) ||
      !validate(validDesc) ||
      !validate(validMd)
    ) {
      const errMess = `文字が正しくありません`;
      alert(errMess);
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

  renderContent() {}

}





class ProjectList extends Component<HTMLDivElement, HTMLElement> implements DragTarget {

  assignedProjects: Project[];

  constructor(private stateType: 'active' | 'finished') {
    super('project-list', 'app', false, `${stateType}-projects`);

    this.assignedProjects = [];

    this.configure();
    this.renderContent();
  }

  @autobind
  dragOverHandler(event: DragEvent): void {
    if (event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
      event.preventDefault();
      const listEl = this.editElements.querySelector('ul')!;
      listEl.classList.add('droppable');
      // console.log("dragOverHandler", listEl);
    }
  }


  @autobind
  dropHandler(event: DragEvent): void {
      event.preventDefault();
    const prjId = event.dataTransfer!.getData('text/plain');
    // console.log("prjId", prjId);
    prjState.moveProject(prjId, this.stateType === 'active' ? ProjectStatus.Active: ProjectStatus.Finished );
  }

  @autobind
  dragLeaveHandler(_event: DragEvent): void {
    const dropEl = this.editElements.querySelector('ul')!;
    dropEl.classList.remove('droppable');
  }

  renderContent() {
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
      this.editElements.addEventListener('dragover', this.dragOverHandler);
      this.editElements.addEventListener('drop', this.dropHandler);
      this.editElements.addEventListener('dragleave', this.dragLeaveHandler);

    prjState.addListener((projects: Project[]) => {
      const relevantProjects = projects.filter((prj) => {
        if(this.stateType === 'active') {
          return prj.status === ProjectStatus.Active;
        }
        return prj.status === ProjectStatus.Finished;
      });
      this.assignedProjects = relevantProjects;
      // console.log("asignedProject:", relevantProjects);
      this.renderProject();
    });
  }
}




class ProjectItem implements Draggable {
  baseElements: HTMLTemplateElement;
  outputElements: HTMLDivElement;
  editElements: HTMLLIElement;

  private project: Project;

  private get mandaychk() {
    if (this.project.manday < 20) {
      return this.project.manday.toString() + '人日';
    } else {
      return (this.project.manday / 20).toString() + '人月';
    }
  }

  constructor(public getProject: Project, public hostId: string) {
    this.project = getProject;

    this.baseElements = document.getElementById('single-project')! as HTMLTemplateElement;
    this.outputElements = document.getElementById(hostId)! as HTMLDivElement;

    const addNode = document.importNode(this.baseElements.content, true);
    this.editElements = addNode.firstElementChild as HTMLLIElement;

    if (this.project.id) {
      this.editElements.id = this.project.id;
      this.editElements.draggable = true;
    }

    this.configure();
    this.renderContet();
    this.attach();
  }

  @autobind
  dragStartHandler(event: DragEvent): void {
      event.dataTransfer!.setData('text/plain', this.project.id);
      event.dataTransfer!.effectAllowed = 'move';
    console.log("dragstart:", event.dataTransfer);
  }

  dragEndHandler(_event: DragEvent): void {
    console.log("Drag終了");
  }

  configure() {
    this.editElements.addEventListener('dragstart', this.dragStartHandler);
    this.editElements.addEventListener('dragend', this.dragEndHandler);
  }

  renderContet() {
    this.editElements.querySelector('h2')!.textContent = this.project.title;
    this.editElements.querySelector('h3')!.textContent = this.project.description;
    this.editElements.querySelector('p')!.textContent = this.mandaychk;
  }

  attach() {
    // console.log("li要素書き出し:", this.editElements);
    this.outputElements.insertAdjacentElement('afterbegin', this.editElements);
  }

}



const prjState = ProjectState.getInstance();
const actvPrjList = new ProjectList('active');
const finsPrjList = new ProjectList('finished');
const prjInput = new ProjectInput();
