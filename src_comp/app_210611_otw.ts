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

interface Validateble {
  value: string | number,
  required: boolean,
  maxLength?: number,
  minLength?: number,
  max?: number,
  min?: number,
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

// abstract class Component {

//   constructor(
//   ) {
//   }

// }

// type Listener<T> = (items: T[]) => void;



type ListenerFunct = (items: Project[]) => void;



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

function validate(inputValue: Validateble) {
  let isValid = true;

  if (inputValue.required) {
    isValid = isValid && inputValue.value.toString().trim().length !== 0;
    // console.log(inputValue.value, inputValue.value.toString().trim().length ,"文字数", isValid);
  }
  if (inputValue.minLength != null && typeof inputValue.value === 'string') {
    isValid = isValid && inputValue.minLength <= inputValue.value.length;
    // console.log(inputValue.value, "文字数ちさいよ", isValid);
  }
  if (inputValue.maxLength != null && typeof inputValue.value === 'string') {
    isValid = isValid && inputValue.maxLength >= inputValue.value.length;
    // console.log(inputValue.value, "文字数でかいよ", isValid);
  }
  if (inputValue.max != null && typeof inputValue.value === 'number') {
    isValid = isValid && inputValue.max >= inputValue.value;
    // console.log(typeof inputValue.value, inputValue.value, "maxよりでかいよ", isValid);
  }
  if (inputValue.min != null && typeof inputValue.value === 'number') {
    isValid = isValid && inputValue.min <= inputValue.value;
    // console.log(typeof inputValue.value, inputValue.value, "minよりちさいよ", isValid);
  }

  return isValid;
}














class ProjectState {
  private static instance: ProjectState;
  projectsArr: Project[] = [];
  projectListeners: Function[] = [];

  private constructor() {}

  addProject(titleTx: string, descTx: string, manTx: number) {
    const newProject = new Project(
      Math.random().toString(),
      titleTx,
      descTx,
      manTx,
      ProjectStatus.Active,
    );
    this.projectsArr.push(newProject);
    console.log("addProject->projectArr:", this.projectsArr);
    this.updateListeners();
  }

  addListener(listenerFn: Function) {
    // 受け取った関数を projectListeners に追加する
    this.projectListeners.push(listenerFn);
    // console.log("addListener->projectListeners:", this.projectListeners);
  }

  moveProject(prjId: string, prjState: ProjectStatus) {
    const changeProject = this.projectsArr.find((project) => prjId === project.id);
    console.log(changeProject);
    if (changeProject && changeProject.status !== prjState) {
      changeProject.status = prjState;
      this.updateListeners();
    }
  }

  private updateListeners() {
    for (const listenerFn of this.projectListeners) {
      // projectListeners の配列の中身は関数への参照なので  listenerFn(); で実行できる
      listenerFn(this.projectsArr.slice());
      console.log("updateListeners>listenerFn:", listenerFn);
    }
    console.log("updateListeners->projectListeners:", this.projectListeners);
  }

  static getInstance() {
    if (!ProjectState.instance) {
      ProjectState.instance = new ProjectState;
    }
    return ProjectState.instance;
  }
}





class ProjectInput {
  baseElements: HTMLTemplateElement;
  outputElements: HTMLDivElement;
  editElements: HTMLFormElement;

  inputElTtl: HTMLInputElement;
  inputElDesc: HTMLInputElement;
  inputElMd: HTMLInputElement;

  constructor() {
    this.baseElements = document.getElementById('project-input')! as HTMLTemplateElement;
    this.outputElements = document.getElementById('app')! as HTMLDivElement;

    const baseNode = document.importNode(this.baseElements.content ,true);
    this.editElements = baseNode.firstElementChild! as HTMLFormElement;
    this.editElements.id = 'user-input';

    this.inputElTtl = this.editElements.querySelector('#title')! as HTMLInputElement;
    this.inputElDesc = this.editElements.querySelector('#description')! as HTMLInputElement;
    this.inputElMd = this.editElements.querySelector('#manday')! as HTMLInputElement;

    this.renderContent();

    this.attach();
    this.configure();
  }

  @autobind
  private submitHandler(event: Event) {
    event.preventDefault();
    const userInput = this.gatherUserInput();
    if (Array.isArray(userInput)) {
      const [title, description, manday] = userInput;
      // console.log(title, description, manday);
      prjState.addProject(title, description, manday);
      this.clearInputs()
    }
  }

  private gatherUserInput(): [string, string, number] | void {
    const inputTtl = this.inputElTtl.value;
    const inputDesc = this.inputElDesc.value;
    const inputMd = this.inputElMd.value;

    const validTtl: Validateble = {
      value: inputTtl,
      required: true,
      minLength: 2,
    }
    const validDesc:Validateble = {
      value: inputDesc,
      required: true,
      maxLength: 300,
    }
    const validMd: Validateble = {
      value: +inputMd,
      required: true,
      max: 10000,
      min: 3,
    }

    if (
        validate(validTtl) &&
        validate(validDesc) &&
        validate(validMd)
    ) {
      return [inputTtl, inputDesc, +inputMd];
    } else {
      alert("入力が正しくありません");
      return;
    }
  }

  private clearInputs() {
    this.inputElTtl.value = '';
    this.inputElDesc.value = '';
    this.inputElMd.value = '';
  }

  private configure() {
    this.editElements.addEventListener('submit', this.submitHandler);
  }

  renderContent() {}

  private attach() {
    this.outputElements.insertAdjacentElement('afterbegin', this.editElements);
  }
}





class ProjectList implements DragTarget {
  baseElements: HTMLTemplateElement;
  outputElements: HTMLDivElement;
  editElements: HTMLElement;

  asignedProjects: Project[];

  constructor(public projectType: 'active' | 'finished') {
    this.asignedProjects = [];
    this.baseElements = document.getElementById('project-list')! as HTMLTemplateElement;
    this.outputElements = document.getElementById('app')! as HTMLDivElement;

    const baseNode = document.importNode(this.baseElements.content, true);
    this.editElements = baseNode.firstElementChild as HTMLElement;
    this.editElements.id = `${projectType}-projects`;

    this.renderContent();

    this.attach();
    this.configure();
  }

  @autobind
  dragOverHandler(event: DragEvent): void {
    // console.log('ドラッグover');
    if (event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
      event.preventDefault();
      const dragEl = this.editElements.querySelector('ul')!;
      dragEl.classList.add('droppable');
    }
  }

  @autobind
  dropHandler(event: DragEvent): void {
    console.log('ドラッグdrop');
    // event.preventDefault();
    const prjId = event.dataTransfer!.getData('text/plain');
    prjState.moveProject(prjId, this.projectType === 'active' ? ProjectStatus.Active: ProjectStatus.Finished);
    const dragEl = this.editElements.querySelector('ul')!;
    dragEl.classList.remove('droppable');
  }


  @autobind
  dragLeaveHandler(_event: DragEvent): void {
    // console.log('ドラッグleave');
    const dragEl = this.editElements.querySelector('ul')!;
    dragEl.classList.remove('droppable');
  }

  private renderContent() {
    const renderId = `${this.projectType}-projects-list`;
    this.editElements.querySelector('ul')!.id = renderId;
    this.editElements.querySelector('h2')!.textContent = this.projectType === 'active' ? '稼働中プロジェクト' : '完了プロジェクト';
  }

  private renderProject() {
    const renderLi = document.getElementById(`${this.projectType}-projects-list`)! as HTMLUListElement;
    renderLi.innerHTML = '';
    this.asignedProjects.forEach((project) => {
      new ProjectItem(project, renderLi.id);
      // console.log("ProjectList:renderProject:", project);
    });
  }

  private configure() {
    this.editElements.addEventListener('dragover', this.dragOverHandler);
    this.editElements.addEventListener('drop', this.dropHandler);
    this.editElements.addEventListener('dragleave', this.dragLeaveHandler);

    prjState.addListener((projects: Project[]) => { // addListener に project を表示する関数を listener関数として渡す
      const relevantProjects = projects.filter((prj) => {
        if (this.projectType === 'active') {
          return prj.status === ProjectStatus.Active;
        }
        return prj.status === ProjectStatus.Finished;
      });
      this.asignedProjects = relevantProjects;
      this.renderProject();
    });
    // console.log("asigned:", this.asignedProjects);
  }

  private attach() {
    this.outputElements.insertAdjacentElement('beforeend', this.editElements);
  }
}




class ProjectItem {
  baseElements: HTMLTemplateElement;
  outputElements: HTMLUListElement;
  editElements: HTMLLIElement;

  project: Project;

  constructor(public getProject: Project, public listId: string) {
    this.project = getProject;
    this.baseElements = document.getElementById('single-project')! as HTMLTemplateElement;
    this.outputElements = document.getElementById(listId)! as HTMLUListElement;

    const baseNode = document.importNode(this.baseElements.content, true);
    this.editElements = baseNode.firstElementChild as HTMLLIElement;
    if (this.project.id) {
      this.editElements.id = this.project.id;
      this.editElements.draggable = true;
    }


    this.attach();
    this.configure();

    this.renderContent();
  }

  @autobind
  dragStartHandler(event: DragEvent): void {
    console.log('ドラッグstarts');
    event.dataTransfer!.setData('text/plain', this.project.id);
    event.dataTransfer!.effectAllowed = 'move';
  }

  dragEndHandler(_event: DragEvent): void {
    console.log('ドラッグend');
  }

  private mandayCheck() {
    if (this.project.manday > 20) {
      return String(this.project.manday / 20 + '人月');
    }
    return String(this.project.manday + '人日')
  }

  private configure() {
    this.editElements.addEventListener('dragstart', this.dragStartHandler)
    this.editElements.addEventListener('dragend', this.dragEndHandler)
  }

  private renderContent() {
    this.editElements.querySelector('h2')!.textContent = this.project.title;
    this.editElements.querySelector('h3')!.textContent = this.project.description;
    this.editElements.querySelector('p')!.textContent = this.mandayCheck();
  }

  private attach() {
    this.outputElements.insertAdjacentElement('afterbegin', this.editElements);
  }

}



const prjState = ProjectState.getInstance();
const actvPrjList = new ProjectList('active');
const finsPrjList = new ProjectList('finished');
const prjInput = new ProjectInput();
