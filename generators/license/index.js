const Generator = require('yeoman-generator');
const gitConfig = require('git-config');

const licenses = [
    {name: 'Apache 2.0', value: 'Apache-2.0'},
    {name: 'BSD 3-Clause (NewBSD) License', value: 'BSD-3-Clause'}
];

module.exports = class GeneratorLicense extends Generator {
    constructor(args, opts) {
        super(args, opts);

        this.option('name', {
            type: String,
            desc: 'Name of the license owner',
            required: false
        });

        this.option('email', {
            type: String,
            desc: 'Email of the license owner',
            required: false
        });

        this.option('website', {
            type: String,
            desc: 'Website of the license owner',
            required: false
        });

        this.option('since', {
            type: String,
            desc: 'Sine year to include on the license',
            required: false,
            defaults: (new Date()).getFullYear()
        });

        this.option('license', {
            type: String,
            desc: 'Select a license, so no license prompt will happen, in case you want to handle it outside of this generator',
            required: false,
            defaults: 'Apache 2.0'
        });

        this.option('output', {
            type: String,
            desc: 'Set the output file for the generated license',
            required: false,
            defaults: 'LICENSE'
        });
    }

    initializing() {
        this.gitc = gitConfig.sync();
        this.gitc.user = this.gitc.user || {};
    }

    prompting() {
        const prompts = [
            {
                name: 'name',
                message: 'What\'s your name:',
                default: this.options.name || this.gitc.user.name,
                when: this.options.name === null || this.options.name === undefined
            },
            {
                name: 'email',
                message: 'Your email (optional):',
                default: this.options.email || this.gitc.user.email,
                when: !this.options.email
            },
            {
                name: 'website',
                message: 'Your website (optional):',
                default: this.options.website,
                when: !this.options.website
            },
            {
                type: 'list',
                name: 'license',
                message: this.options.licensePrompt,
                default: this.options.license,
                when: !this.options.license || licenses.find(x => x.value === this.options.license) === undefined,
                choices: licenses
            }
        ];

        return this.prompt(prompts).then(props => {
            this.props = Object.assign({
                name: this.options.name,
                email: this.options.email,
                website: this.options.website,
                license: this.options.license
            }, props);
        });
    }

    writing() {
        // license file
        const filename = this.props.license + '.txt';
        let author = this.props.name.trim();
        if (this.props.email) {
            author += ' <' + this.props.email.trim() + '>';
        }
        if (this.props.website) {
            author += ' (' + this.props.website.trim() + ')';
        }

        this.fs.copyTpl(
            this.templatePath(filename),
            this.destinationPath(this.options.output),
            {
                year: this.options.year,
                author: author
            }
        );

        // package
        if (!this.fs.exists(this.destinationPath('package.json'))) {
            return;
        }

        const pkg = this.fs.readJSON(this.destinationPath('package.json'), {});
        pkg.license = this.props.license;

        // We don't want users to publish their module to NPM if they copyrighted
        // their content.
        if (this.props.license === 'nolicense') {
            delete pkg.license;
            pkg.private = true;
        }

        this.fs.writeJSON(this.destinationPath('package.json'), pkg);
    }
};
