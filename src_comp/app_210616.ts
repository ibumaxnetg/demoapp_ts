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
  required: boolean;
  maxLength?: number;
  minLength?: number;
  max?: number;
  min?: number;
}

// abstract class Component {

//   constructor(
//   ) {
//   }

// }

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
    // console.log(inputValidate.value, isValid, 'required');
  }
  if (inputValidate.minLength != null && typeof inputValidate.value === 'string') {
    isValid = isValid && inputValidate.value.length >= inputValidate.minLength;
    // console.log(inputValidate.value, isValid, 'minLength');
  }
  if (inputValidate.maxLength != null && typeof inputValidate.value === 'string') {
    isValid = isValid && inputValidate.value.length <= inputValidate.maxLength;
    // console.log(inputValidate.value, isValid, 'minLength');
  }
  if (inputValidate.min != null && typeof inputValidate.value === 'number') {
    isValid = isValid && inputValidate.value >= inputValidate.min;
    // console.log(inputValidate.value, isValid, 'min');
  }
  if (inputValidate.max != null && typeof inputValidate.value === 'number') {
    isValid = isValid && inputValidate.value <= inputValidate.max;
    // console.log(inputValidate.value, isValid, 'max');
  }
  return isValid;
}




class ProjectState {
  projectsArr: Project[] = [];
  projectListeners: Function[] = [];

  constructor() {  }

  addProject(titleInp: string, descriptionInp: string, mandayInp: number) {
    const newProject = new Project(
      Math.random().toString(),
      titleInp,
      descriptionInp,
      mandayInp,
      ProjectStatus.Active,
    );
    this.projectsArr.push(newProject);
    this.updateListeners();
  }

  addListener(listenerFn: Function) {
    this.projectListeners.push(listenerFn);
  }

  moveProject(moveId: string, moveStatus: 'active' | 'finished') {
    const changeProject = this.projectsArr.find((project) => project.id == moveId);
    if (changeProject) {
      changeProject.status =  moveStatus === 'active' ? ProjectStatus.Active: ProjectStatus.Finished;
      this.updateListeners();
    }
  }

  private updateListeners() {
    this.projectListeners.forEach((listener) => {
      listener(this.projectsArr.slice());
    });
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
    public tmpId: string = 'project-input',
    public setId: string = 'app',
    public attachePos: boolean = true,
    public editId: string = 'user-input'
  ) {
    this.baseElements = document.getElementById(tmpId)! as  HTMLTemplateElement;
    this.outputElements = document.getElementById(setId)! as HTMLDivElement;

    const tmpElements = document.importNode(this.baseElements.content, true);
    this.editElements = tmpElements.firstElementChild as HTMLFormElement;
    this.editElements.id = editId;

    this.inputTtlElement = this.editElements.querySelector('#title')! as HTMLInputElement;
    this.inputDescElement = this.editElements.querySelector('#description')! as HTMLInputElement;
    this.inputMdElement = this.editElements.querySelector('#manday')! as HTMLInputElement;

    this.configure();
    this.renderContent();
    this.attach(attachePos);
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
    // console.log("preevent", prjState.projectsArr);
  }

  private gatherUserInput():[string, string, number] | void {
    const InputTitle = this.inputTtlElement.value;
    const InputDesc = this.inputDescElement.value;
    const InputMd = this.inputMdElement.value;

    const validTtl = {
      value: InputTitle,
      required: true,
      minLength: 2,
    }
    const validDesc = {
      value: InputDesc,
      required: true,
      maxLength: 200,
    }
    const validMd = {
      value: InputMd,
      required: true,
      min: 2,
      max: 10000,
    }

    if (
      validate(validTtl) &&
      validate(validDesc) &&
      validate(validMd)
    ) {
      return [InputTitle, InputDesc, +InputMd];
    } else {
      alert('入力値が正しくありません');
      return;
    }
  }

  private configure() {
    this.editElements.addEventListener('submit', this.submitHandler);
  }

  private renderContent() {}

  private attach(AttachAt: boolean) {
    const adjAt = AttachAt === true ? 'afterbegin': 'beforeend';
    this.outputElements.insertAdjacentElement(adjAt, this.editElements );
  }

  private clearInputs() {
    this.inputTtlElement.value = '';
    this.inputDescElement.value = '';
    this.inputMdElement.value = '';
  }
}





class ProjectList implements DragTarget {
  baseElements: HTMLTemplateElement;
  outputElements: HTMLElement;
  editElements: HTMLElement;

  asignedProjects: Project[];

  constructor(
    public listType: 'active' | 'finished',
    public tmpId: string = 'project-list',
    public setId: string = 'app',
    public attachePos: boolean = false,
    public editId: string = `${listType}-projects`,
  ) {
    this.baseElements = document.getElementById(tmpId)! as HTMLTemplateElement;
    this.outputElements = document.getElementById(setId)! as HTMLElement;

    const tmpElements = document.importNode(this.baseElements.content, true);
    this.editElements = tmpElements.firstElementChild as HTMLElement;
    this.editElements.id = editId;

    this.asignedProjects = [];

    this.configure();
    this.renderContent();
    this.attach(attachePos);
  }

  @autobind
  dragOverHandler(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer && event.dataTransfer!.types[0] === 'text/plain') {
      const targetEl = this.editElements.querySelector(`#${this.listType}-projects-list`)!;
      targetEl.classList.add('droppable');
    }
  }

  @autobind
  dropHandler(event: DragEvent): void {
    event.preventDefault();
    const moveId = event.dataTransfer!.getData('text/plain');
    prjState.moveProject(moveId, `${this.listType}`);
    // console.log(moveId, `${this.listType}`);
  }

  @autobind
  dragLeaveHandler(_event: DragEvent): void {
    const dragEl = document.querySelector(`#${this.listType}-projects-list`)!;
    dragEl.classList.remove('droppable');
  }

  private renderContent() {
    this.editElements.querySelector('ul')!.id = `${this.listType}-projects-list`;
    this.editElements.querySelector('h2')!.textContent = this.listType === 'active' ? '稼働中オブジェクト': '完了オブジェクト';
  }

  private renderProjects() {
    const editUlElements = document.getElementById(`${this.listType}-projects-list`)! as HTMLUListElement;
    editUlElements.innerHTML = '';
    this.asignedProjects.forEach((project) => {
      // const listEl = document.createElement('li');
      // listEl.textContent = project.title;
      // editUlElements.appendChild(listEl);
      new ProjectItem(editUlElements.id, project);
      // console.log(editUlElements.id, project);
    });
  }

  private configure() {
    this.editElements.addEventListener('dragover', this.dragOverHandler);
    this.editElements.addEventListener('drop', this.dropHandler);
    this.editElements.addEventListener('dragleave', this.dragLeaveHandler);

    prjState.addListener((projects: Project[]) => {
      const listTypeProject = projects.filter((project) => {
        if (this.listType === 'active') {
          return project.status === ProjectStatus.Active;
        }
        return project.status === ProjectStatus.Finished;
      });
      this.asignedProjects = listTypeProject;
      this.renderProjects();
    });
  }

  private attach(attachAt: boolean) {
    const adjAt = attachAt === true ? 'afterbegin': 'beforeend';
    this.outputElements.insertAdjacentElement(adjAt, this.editElements)
  }
}




class ProjectItem implements Draggable {
  baseElements: HTMLTemplateElement;
  outputElements: HTMLUListElement;
  editElements: HTMLLIElement;

  project: Project;

  constructor(
    public setId: string,
    public projectCont: Project,
    public tmpId: string = 'single-project',
    public attachePos: boolean = false,
  ) {

    this.project = projectCont;

    this.baseElements = document.getElementById(tmpId)! as HTMLTemplateElement;
    this.outputElements = document.getElementById(setId) as HTMLUListElement;

    const tmpElements = document.importNode(this.baseElements.content, true);
    this.editElements = tmpElements.firstElementChild as HTMLLIElement;
    this.editElements.id = setId;
    this.editElements.draggable = true;

    this.configure();
    this.renderContent();
    this.attach(attachePos);

  }

  @autobind
  dragStartHandler(event: DragEvent): void {
    event.dataTransfer!.setData('text/plain', this.project.id);
    event.dataTransfer!.effectAllowed = 'move';
    // console.log('dran-start');
  }

  @autobind
  dragEndHandler(_event: DragEvent): void {
    // console.log('dran-end');
  }


  private get mandayChk() {
    if (this.project.manday < 20) {
      return this.project.manday / 20 + '人月';
    }
    return this.project.manday + '人月';
  }

  private configure() {
    this.editElements.addEventListener('dragstart', this.dragStartHandler);
    this.editElements.addEventListener('dragend', this.dragEndHandler);
  }

  private renderContent() {
    const newH2 = document.createElement('h2');
    const newH3 = document.createElement('h3');
    const newP = document.createElement('p');
    newH2.textContent = this.project.title;
    newH3.textContent = this.project.description;
    newP.textContent = this.mandayChk;

    this.editElements.insertAdjacentElement('beforeend', newH2);
    this.editElements.insertAdjacentElement('beforeend', newH3);
    this.editElements.insertAdjacentElement('beforeend', newP);

    this.editElements.id = this.project.id;
 }

  private attach(attachAt: boolean) {
    const adjAt = attachAt === true ? 'afterbegin': 'beforeend';
    this.outputElements.insertAdjacentElement(adjAt, this.editElements)
  }

}




const prjState = new ProjectState();
const actvPrjList = new ProjectList('active');
const finsPrjList = new ProjectList('finished');
const prjInput = new ProjectInput();
