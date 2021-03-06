const CLI = require('./CLI');
const Project = require('./GitHub/Project');
const HttpLoader = require('./Loader/HttpLoader');
const { green } = require('./Util/colors');

class GithubAgileDashboard {
    /**
     * @param {Sring} owner
     * @param {String} repo
     * @param {String} username
     * @param {String} password
     * @param {String} cacheDir
     * @param {Array} commands
     */
    constructor(owner, repo, username, password, cacheDir, commands = ['status']) {
        this.cli = new CLI('gad> ', commands);
        this.loader = new HttpLoader(this.setProject.bind(this), owner, repo, username.trim(), password, cacheDir);
        this.user = username.trim();
        this.project = null;

        this.helpCommand = this.helpCommand.bind(this);
        this.statusCommand = this.statusCommand.bind(this);
        this.sprintCommand = this.sprintCommand.bind(this);
        this.sprintsCommand = this.sprintsCommand.bind(this);
        this.backlogCommand = this.backlogCommand.bind(this);
        this.reviewCommand = this.reviewCommand.bind(this);
        this.changelogCommand = this.changelogCommand.bind(this);
        this.estimateCommand = this.estimateCommand.bind(this);

        this.loader.load();
    }

    /**
     * Init CLI (if not already done)
     */
    onInit() {
        if (!this.cli.ready) {
            this.cli.on('help', this.helpCommand);
            this.cli.on('status', this.statusCommand);
            this.cli.on('sprint', this.sprintCommand);
            this.cli.on('sprints', this.sprintsCommand);
            this.cli.on('backlog', this.backlogCommand);
            this.cli.on('review', this.reviewCommand);
            this.cli.on('changelog', this.changelogCommand);
            this.cli.on('estimate', this.estimateCommand);
            this.cli.on('unknown', this.helpCommand);
            this.cli.on('refresh', this.loader.load);
            this.cli.on('reset', this.loader.reset);
            this.cli.setReady();
        }
    }

    /**
     * Load projet from data
     *
     * @param {Array} data
     */
    setProject(data) {
        this.project = new Project(data);
        this.statusCommand();
        this.onInit();
    }

    /**
     * Show the status of the repository
     */
    statusCommand() {
        const { pullRequests, issues } = this.project;

        this.cli.result(`✅  ${issues.size} issues and ${pullRequests.size} PR fetched.`);
    }

    /**
     * Show the state of the backlog
     */
    backlogCommand() {
        const milestones = this.project.getBacklogs();

        this.cli.result(milestones.map(milestone => milestone.display()));
    }

    /**
     * Show the state of the current sprint
     */
    sprintCommand() {
        this.cli.result(this.project.getCurrentMilestone().display());
    }

    /**
     * Show the state of all sprints
     */
    sprintsCommand() {
        const milestones = this.project.getSprints();

        this.cli.result(milestones.map(milestone => milestone.display()));
    }

    /**
     * Display PullRequest that are awaiting your review
     */
    reviewCommand() {
        const pullRequests = this.project.getPullRequestsAwaitingReview(this.user);
        const { length } = pullRequests;

        if (length === 0) {
            return this.cli.result('Nothing to review. Good job! 👍');
        }

        this.cli.result([`🔍  ${green(length)} pull requests awaiting your review:`]
            .concat(pullRequests.map(pullRequest => pullRequest.display()))
            .join('\r\n'));
    }

    /**
     * Generate a markdown changelog of the current sprint
     */
    changelogCommand() {
        this.cli.result(this.project.getCurrentMilestone().displayChangelog());
    }

    /**
     * Show stories that are missing estimation
     */
    estimateCommand() {
        this.cli.result(this.project.getIssuesMissingEstimation().map(issue => issue.display()));
    }

    /**
     * Display help
     */
    helpCommand() {
        this.cli.result(`Available commands: ${Array.from(this.cli.commands).join(', ')}`);
    }
}

module.exports = GithubAgileDashboard;
