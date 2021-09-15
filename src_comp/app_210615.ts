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
  required: boolean,
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

function validate(inputValidate: Validatable) {
  let isValid = true;

  if (inputValidate.required) {
    isValid = isValid && inputValidate.value.toString().trim().length !== 0;
    isValid = isValid && inputValidate.value.toString().trim().length >= 0;
    // console.log(inputValidate.value, inputValidate.value.toString().trim().length ,"文字数", isValid);
  }
  if (inputValidate.maxLength != null && typeof inputValidate.value === 'string') {
    isValid = isValid && inputValidate.value.length <= inputValidate.maxLength;
    // console.log(inputValidate.value, "文字数おおきい", isValid);
  }
  if (inputValidate.minLength != null && typeof inputValidate.value === 'string') {
    isValid = isValid && inputValidate.value.length >= inputValidate.minLength;
    // console.log(inputValidate.value, "文字数ちさい", isValid);
  }
  if (inputValidate.max != null && typeof inputValidate.value === 'number') {
    isValid = isValid && inputValidate.value <= inputValidate.max;
    // console.log(inputValidate.value, "すうじおおきいよ", isValid);
  }
  if (inputValidate.min != null && typeof inputValidate.value === 'number') {
    isValid = isValid && inputValidate.value >= inputValidate.min;
    // console.log(inputValidate.value, "すうじちさいよ", isValid);
  }

  return isValid;
}




class ProjectState {
  private static instance: ProjectState;
  projectsArr: Project[] = [];
  projectListeners: Function[] = [];

  private constructor() {  }

  addProject(titleDt: string, descriptionDt: string, mandayDt: number) {
    const newProject = new Project(
      Math.random().toString(),
      titleDt,
      descriptionDt,
      mandayDt,
      ProjectStatus.Active,
    );
    this.projectsArr.push(newProject);
    this.updateListeners();
  }

  addListener(listenerFn: Function) {
    this.projectListeners.push(listenerFn);
  }

  updateListeners() {
    this.projectListeners.forEach((func) => {
      func(this.projectsArr.slice());
    });
  }

  moveProject(projectId: string, statusValue: ProjectStatus) {
    const changeProject = this.projectsArr.find((project) => projectId === project.id);
    if (changeProject && statusValue !== changeProject.status) {
      changeProject.status = statusValue;
      console.log(changeProject);
      this.updateListeners();
    }
  }

  static getInstance() {
    if (!ProjectState.instance) {
      ProjectState.instance = new ProjectState();
    }
    return ProjectState.instance;
  }
}





class ProjectInput {
  baseElements: HTMLTemplateElement;
  outputElements: HTMLDivElement;
  editElements: HTMLFormElement;

  inputTtlElement: HTMLInputElement;
  inputDescElement: HTMLInputElement;
  inputMdElement: HTMLInputElement;

  constructor() {
    this.baseElements = document.getElementById('project-input')! as HTMLTemplateElement;
    this.outputElements = document.getElementById('app')! as HTMLDivElement;

    const TmpElements = document.importNode(this.baseElements.content, true);
    this.editElements = TmpElements.firstElementChild as HTMLFormElement;
    this.editElements.id = 'user-input';

    this.inputTtlElement = this.editElements.querySelector('#title')! as HTMLInputElement;
    this.inputDescElement = this.editElements.querySelector('#description')! as HTMLInputElement;
    this.inputMdElement = this.editElements.querySelector('#manday')! as HTMLInputElement;

    this.configure();
    this.attach();
  }

  @autobind
  private submitHandler(event: Event) {
    event.preventDefault();
    const userInput = this.gatherUserInput();
    if (Array.isArray(userInput)) {
      const [title, description, manday] = userInput;
      // console.log(this, userInput);
      prjState.addProject(title, description, manday);
      this.clearInput();
    }
  }

  gatherUserInput():[string, string, number] | void {
    const inputTitle = this.inputTtlElement.value;
    const inputDesc = this.inputDescElement.value;
    const inputMd = Number(this.inputMdElement.value);

    const validTtl = {
      value: inputTitle,
      required: true,
      minLength: 2
    }

    const validDesc = {
      value: inputDesc,
      required: true,
      maxLength: 100,
    }

    const validMd = {
      value: inputMd,
      required: true,
      min: 5,
    }

    if (
      validate(validTtl) &&
      validate(validDesc) &&
      validate(validMd)
    ) {
      return [inputTitle, inputDesc, +inputMd];
    } else {
      alert('入力値が正しくありません');
      return;
    }

  }

  configure() {
    this.editElements.addEventListener('submit', this.submitHandler);
  }

  renderContent() {}
  attach() {
    this.outputElements.insertAdjacentElement('afterbegin', this.editElements);
  }

  private clearInput() {
    this.inputTtlElement.value = '';
    this.inputDescElement.value = '';
    this.inputMdElement.value = '';
  }
}





class ProjectList implements DragTarget {
  baseElements: HTMLTemplateElement;
  outputElements: HTMLDivElement;
  editElements: HTMLElement;

  asignedProjects: Project[] =[];

  constructor(public listType: 'active'| 'finished') {
    this.baseElements = document.getElementById('project-list')! as HTMLTemplateElement;
    this.outputElements = document.getElementById('app')! as HTMLDivElement;

    const TmpElements = document.importNode(this.baseElements.content, true);
    this.editElements = TmpElements.firstElementChild as HTMLElement;
    this.editElements.id = `${listType}-projects`;

    this.configure();
    this.renderContent();
    this.attach();
  }

  @autobind
  dragOverHandler(event: DragEvent): void {
    event.preventDefault();
    // console.log('dragover:');
    if( event.dataTransfer && event.dataTransfer!.types[0] === 'text/plain') {
      const ulElement = this.editElements.querySelector(`#${this.listType}-projects-list`)!;
      ulElement.classList.add('droppable');
    }
  }

  @autobind
  dropHandler(event: DragEvent): void {
    event.preventDefault();
    console.log('drop:', this.listType === 'active' ? ProjectStatus.Active: ProjectStatus.Finished);
    const moveId = event.dataTransfer!.getData('text/plain');
    prjState.moveProject(moveId, this.listType === 'active' ? ProjectStatus.Active: ProjectStatus.Finished);
    // const ulElement = this.editElements.querySelector(`#${this.listType}-projects-list`)!;
    // ulElement.classList.remove('droppable');
  }

  @autobind
  dragLeaveHandler(_event: DragEvent): void {
    // console.log('dragleave:');
    const ulElement = this.editElements.querySelector(`#${this.listType}-projects-list`)!;
    ulElement.classList.remove('droppable');
  }

  renderContent() {
    this.editElements.querySelector('ul')!.id = `${this.listType}-projects-list`;
    this.editElements.querySelector('h2')!.textContent = this.listType === 'active' ? '稼働中プロジェクト': '完了プロジェクト';
  }

  renderProjects() {
    const addElement = document.getElementById(`${this.listType}-projects-list`)! as HTMLUListElement;
    addElement.innerHTML = '';
    this.asignedProjects.forEach((project) => {
      new ProjectItem(addElement.id, project);
      // console.log('renderProjects:', project);
    });
  }

  configure() {
    this.editElements.addEventListener('dragover', this.dragOverHandler);
    this.editElements.addEventListener('drop', this.dropHandler);
    this.editElements.addEventListener('dragleave', this.dragLeaveHandler);

    prjState.addListener((projects: Project[]) => {
      const filterresult = projects.filter((project) => {
        if (this.listType === 'active') {
          return project.status === ProjectStatus.Active;
        }
        return project.status === ProjectStatus.Finished;
      });
      this.asignedProjects = filterresult;
      this.renderProjects();
    });
  }

  attach() {
    this.outputElements.insertAdjacentElement('beforeend', this.editElements);
  }
}




class ProjectItem implements Draggable {
  baseElements: HTMLTemplateElement;
  outputElements: HTMLLIElement;
  editElements: any;

  project: Project;

  constructor(public renderId: string, public getProject: Project) {
    this.project = getProject;
    this.baseElements = document.getElementById('single-project')! as HTMLTemplateElement;
    this.outputElements = document.getElementById(renderId)! as HTMLLIElement;

    const tmpElement = document.importNode(this.baseElements.content, true);
    this.editElements = tmpElement.firstElementChild as HTMLLIElement;

    this.editElements.id = this.project.id;
    this.editElements.draggable = true;

    this.configure();
    this.renderContet();
    this.attach();
  }

  @autobind
  dragStartHandler(event: DragEvent): void {
    event.dataTransfer!.setData('text/plain', this.project.id);
    event.dataTransfer!.effectAllowed = 'move';
    // console.log('drag start', this.project.id);
  }

  dragEndHandler(_event: DragEvent): void {
    console.log('drag end');
  }

  configure() {
    this.editElements.addEventListener('dragstart', this.dragStartHandler);
    this.editElements.addEventListener('dragend', this.dragEndHandler);
  }

  renderContet() {
    const newH2 = document.createElement('h2');
    const newH3 = document.createElement('h3');
    const newP = document.createElement('p');
    newH2.textContent = this.project.title;
    newH3.textContent = this.project.description;
    newP.textContent = this.project.manday.toString()
    this.editElements.insertAdjacentElement('beforeend', newH2);
    this.editElements.insertAdjacentElement('beforeend', newH3);
    this.editElements.insertAdjacentElement('beforeend', newP);
  }

  attach() {
    this.outputElements.insertAdjacentElement('afterbegin', this.editElements);
  }
}




const prjState = ProjectState.getInstance();
const actvPrjList = new ProjectList('active');
const finsPrjList = new ProjectList('finished');
const prjInput = new ProjectInput();
