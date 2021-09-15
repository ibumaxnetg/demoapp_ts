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

// validate
interface Validatable {
  value: string | number; // 受け取る値
  required?: boolean; // 必須判定
  minlength?: number; // 最大文字数
  maxlength?: number; // 最小文字数
  min?: number; // 最大値
  max?: number; // 最小値
}

type Listener<T> = (items: T[]) => void;

class State<T> {
  protected projectListeners: Listener<T>[] = [];

  addListener(listenerFn: Listener<T>) {
    this.projectListeners.push(listenerFn);
  }

}

abstract class Component<T extends HTMLElement, U extends HTMLElement> {
  inputElements: HTMLTemplateElement;
  outputElements: T;
  addElement: U;

  constructor(
    templateId: string,
    hostElementId: string,
    insertPosit: boolean,
    newElementId?: string,
  ) {
    this.inputElements = document.getElementById(templateId)! as HTMLTemplateElement;
    this.outputElements = document.getElementById(hostElementId)! as T;

    const addNode = document.importNode(this.inputElements.content, true);
    this.addElement = addNode.firstElementChild as U;
    if (newElementId) {
      this.addElement.id = newElementId;
    }

    this.attach(insertPosit);
  }

  abstract configure(): void;

  abstract renderContent(): void;

  private attach(insertAtBigining: boolean) {
    this.outputElements.insertAdjacentElement(insertAtBigining ? 'afterbegin': 'beforeend', this.addElement);
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


function validate( validatableInput: Validatable) {
  let isValid = true;
  if (validatableInput.required) {
    isValid = isValid && validatableInput.value.toString().trim().length !== 0;
  }
  if (validatableInput.minlength != null && typeof validatableInput.value === 'string') {
    isValid = isValid && validatableInput.value.length >= validatableInput.minlength;
  }
  if (validatableInput.maxlength != null && typeof validatableInput.value === 'string') {
    isValid = isValid && validatableInput.value.length <= validatableInput.maxlength;
  }
  if (validatableInput.min != null && typeof validatableInput.min === 'number') {
    isValid = isValid && validatableInput.value >= validatableInput.min;
  }
  if (validatableInput.max != null && typeof validatableInput.max === 'number') {
    isValid = isValid && validatableInput.value <= validatableInput.max;
  }
  return isValid;
}





class ProjectState extends State<Project> {
  private static instance: ProjectState;
  private projects: Project[] = [];

  private constructor() {
    super();
  }

  addProject(title: string, description: string, manday: number) {
    const newProject = new Project(
      Math.random().toString(),
      title,
      description,
      manday,
      ProjectStatus.Active,
    );
    this.projects.push(newProject);
    this.updateListeners();
  }

  static getInstance() {
    if (!ProjectState.instance) {
      ProjectState.instance = new ProjectState();
    }
    return ProjectState.instance;
  }

  moveProject(projectId: string, newStatus: ProjectStatus) {
    const project = this.projects.find(prj => prj.id === projectId);
    if (project && project.status !== newStatus ) {
      project.status = newStatus;
      this.updateListeners();
    }
  }

  private updateListeners() {
    for (const listenerFn of this.projectListeners) {
      listenerFn(this.projects.slice());
    }

  }
}


class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> implements Draggable {
  private project: Project;

  private get manday() {
    if (this.project.manday < 20) {
      return this.project.manday.toString() + '人日';
    } else {
      return (this.project.manday / 20).toString() + '人月';
    }
  }

  constructor(hostId: string, getProject: Project) {
    super('single-project', hostId, false, getProject.id );
    this.project = getProject;
  this.configure();
  this.renderContent();
  }

  @autobind
  dragStartHandler(event: DragEvent) {
    event.dataTransfer!.setData('text/plain', this.project.id);
    event.dataTransfer!.effectAllowed = 'move';
  }

  dranEndHandler(_event: DragEvent) {
    console.log('drag終了');
  }

  configure() {
    this.addElement.addEventListener('dragstart',this.dragStartHandler);
  }

  renderContent() {
// console.log(this.project);
      this.addElement.querySelector('h2')!.textContent = this.project.title;
      this.addElement.querySelector('h3')!.textContent = this.manday;
      this.addElement.querySelector('p')!.textContent = this.project.description;
  }
}


class ProjectList extends Component<HTMLDivElement, HTMLElement> implements DragTarget {
  assignedProjects: Project[];

  constructor(private ul_type: 'active' | 'finished') {
    super('project-list', 'app', false, `${ul_type}-projects`);

    this.assignedProjects = [];

    this.configure();
    this.renderContent();
  }

  @autobind
  dragOverHandler(event: DragEvent) {
    if (event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
      event.preventDefault();
    }
    const listEl = this.addElement.querySelector('ul')!;
    listEl.classList.add('droppable');
  }

  @autobind
  dropHandler(event: DragEvent) {
    const prjId = event.dataTransfer!.getData('text/plain');
    projectState.moveProject(prjId, this.ul_type === 'active' ? ProjectStatus.Active: ProjectStatus.Finished);
  }

  @autobind
  dragLeaveHandler(_event: DragEvent) {
    const listEl = this.addElement.querySelector('ul')!;
    listEl.classList.remove('droppable');
  }

  configure() {
    this.addElement.addEventListener('dragover', this.dragOverHandler);
    this.addElement.addEventListener('drop', this.dropHandler);
    this.addElement.addEventListener('dragleave', this.dragLeaveHandler);

    projectState.addListener((projects: Project[]) => {
      const relevantProjects = projects.filter(prj => {
        if (this.ul_type === 'active') {
          return prj.status === ProjectStatus.Active;
        }
        return prj.status === ProjectStatus.Finished;
      })

      this.assignedProjects = relevantProjects;
      this.renderProjects();
    });
  }

  renderContent() {
    const listLi = `${this.ul_type}-projects-list`;
    this.addElement.querySelector('ul')!.id = listLi;
    this.addElement.querySelector('h2')!.textContent = this.ul_type === 'active' ? '実行中オブジェクト': '完了オブジェクト';
  }

  private renderProjects() {
    const listEl = document.getElementById(`${this.ul_type}-projects-list`)! as HTMLUListElement;
    listEl.innerHTML = '';
    for (const prjItem of this.assignedProjects) {
      new ProjectItem(listEl.id, prjItem);
    }
  }
}


class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
  ttlInputElement: HTMLInputElement;
  dscrInputElement: HTMLInputElement;
  mdInputElement: HTMLInputElement;

  constructor() {
    super('project-input', 'app', true, 'user-input');

    this.ttlInputElement = this.addElement.querySelector('#title') as HTMLInputElement;
    this.dscrInputElement = this.addElement.querySelector('#description') as HTMLInputElement;
    this.mdInputElement = this.addElement.querySelector('#manday') as HTMLInputElement;

    this.configure();
// console.log(this.ttlInputElement);
  }

  configure() {
    this.addElement.addEventListener('submit', this.submitHandler);
    // console.log(this.formElement.input);
  }

  renderContent() {}

  @autobind
  private submitHandler(event: Event) {
    event.preventDefault();
    const userInput = this.gatherUserInput();
    if (Array.isArray(userInput)) {
      const [title, dscr, manday ] = userInput;
      // console.log(title, dscr, manday);
      projectState.addProject(title, dscr, manday);
      this.clearInputs();
    }
  }

  private gatherUserInput(): [string, string, number] | void {
    const enterdTtl = this.ttlInputElement.value;
    const enterdDscr = this.dscrInputElement.value;
    const enterdMd = this.mdInputElement.value;

    const validTtl: Validatable = {
      value: enterdTtl,
      required: true,
      minlength: 4
    }
    const validDscr: Validatable = {
      value: enterdDscr,
      required: true,
      minlength: 4
    }
    const validMd: Validatable = {
      value: Number(enterdMd),
      required: true,
      max: 900
    }

    if (
      !validate(validTtl) ||
      !validate(validDscr) ||
      !validate(validMd)
    ) {
      alert('入力値が正しくありません');
      return;
    } else {
      return [enterdTtl, enterdDscr, Number(enterdMd)];
    }
  }

  private clearInputs() {
    this.ttlInputElement.value = '';
    this.dscrInputElement.value = '';
    this.mdInputElement.value = '';
    }
}

const projectState = ProjectState.getInstance();
const activePrjList = new ProjectList('active');
const finishedPrjList = new ProjectList('finished');
const prjInput = new ProjectInput();
