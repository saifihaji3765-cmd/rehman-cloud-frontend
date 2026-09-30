
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import environmentService from "../../../services/environmentService.js";
import styles from "./EnvironmentSettings.module.css";

const QUICK_ENVIRONMENTS = [
  "development",
  "staging",
  "production",
];

const TYPE_OPTIONS = [
  "string",
  "number",
  "boolean",
  "json",
];

const SCOPE_OPTIONS = [
  "project",
  "deployment",
];

const createDraft = () => ({
  id:
    `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  key: "",
  value: "",
  type: "string",
  scope: "project",
  isSecret: false,
  required: false,
  enabled: true,
});

function unwrap(response) {
  let value = response?.data ?? response;

  if (
    value &&
    typeof value === "object" &&
    value.data &&
    !Array.isArray(value.data)
  ) {
    value = value.data;
  }

  return value;
}

function toList(response, keys = []) {
  const value = unwrap(response);

  if (Array.isArray(value)) return value;

  for (const key of keys) {
    if (Array.isArray(value?.[key])) {
      return value[key];
    }
  }

  return [];
}

function getEnvironmentName(item) {
  if (typeof item === "string") return item;

  return (
    item?.name ||
    item?.environmentName ||
    item?.environment ||
    item?.key ||
    ""
  );
}

function getVariableKey(variable) {
  return (
    variable?.key ||
    variable?.name ||
    variable?.variableName ||
    ""
  );
}

function getVariableValue(variable) {
  const value = variable?.value;

  if (value === undefined || value === null) {
    return "";
  }

  return String(value);
}

function getErrorMessage(error) {
  return (
    error?.message ||
    "Something went wrong. Please try again."
  );
}

function validateDrafts(drafts) {
  const errors = {};
  const seen = new Set();

  drafts.forEach((draft) => {
    const key = draft.key.trim();

    if (!key) {
      errors[draft.id] = "Variable key is required.";
      return;
    }

    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      errors[draft.id] =
        "Use letters, numbers and underscores. The key must not start with a number.";
      return;
    }

    const normalized = key.toLowerCase();

    if (seen.has(normalized)) {
      errors[draft.id] = "Duplicate variable key.";
      return;
    }

    seen.add(normalized);

    if (
      draft.type === "number" &&
      draft.value.trim() !== "" &&
      !Number.isFinite(Number(draft.value))
    ) {
      errors[draft.id] = "Enter a valid number.";
      return;
    }

    if (draft.type === "json" && draft.value.trim() !== "") {
      try {
        JSON.parse(draft.value);
      } catch {
        errors[draft.id] = "Enter valid JSON.";
      }
    }
  });

  return errors;
}

function normalizeVariable(variable) {
  return {
    ...variable,
    key: getVariableKey(variable),
    value: getVariableValue(variable),
    type: variable?.type || "string",
    scope: variable?.scope || "project",
    isSecret: Boolean(
      variable?.isSecret ??
      variable?.secret ??
      variable?.is_secret
    ),
    required: Boolean(variable?.required),
    enabled: variable?.enabled !== false,
  };
}

function StatusDot({ status }) {
  return (
    <span
      className={`${styles.statusDot} ${
        status === "connected"
          ? styles.statusConnected
          : status === "checking"
            ? styles.statusChecking
            : styles.statusDisconnected
      }`}
      aria-hidden="true"
    />
  );
}

export default function EnvironmentSettings({
  projects = [],
  selectedProjectId = "",
  onProjectChange,
}) {
  const [environments, setEnvironments] = useState([]);
  const [activeEnvironment, setActiveEnvironment] =
    useState("");

  const [variables, setVariables] = useState([]);
  const [loadingEnvironments, setLoadingEnvironments] =
    useState(false);
  const [loadingVariables, setLoadingVariables] =
    useState(false);

  const [serviceStatus, setServiceStatus] =
    useState("checking");

  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");

  const [view, setView] = useState("list");
  const [drafts, setDrafts] = useState([createDraft()]);
  const [draftErrors, setDraftErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deletingKey, setDeletingKey] = useState("");
  const [editingKey, setEditingKey] = useState("");
  const [showValues, setShowValues] = useState({});

  const [creatingEnvironment, setCreatingEnvironment] =
    useState(false);

  const [newEnvironmentName, setNewEnvironmentName] =
    useState("");

  const [editingDraft, setEditingDraft] = useState(null);

  const projectId = String(selectedProjectId || "");

  const selectedProject = useMemo(
    () =>
      projects.find(
        (project) =>
          String(
            project?.id ??
            project?._id ??
            project?.projectId ??
            ""
          ) === projectId
      ),
    [projects, projectId]
  );

  const projectName =
    selectedProject?.name ||
    selectedProject?.projectName ||
    "Selected project";

  const setMessage = useCallback((message) => {
    setNotice(message);
  }, []);

  const loadHealth = useCallback(async () => {
    setServiceStatus("checking");

    try {
      await environmentService.health();
      setServiceStatus("connected");
    } catch {
      setServiceStatus("disconnected");
    }
  }, []);

  const loadEnvironments = useCallback(async () => {
    if (!projectId) {
      setEnvironments([]);
      setActiveEnvironment("");
      setVariables([]);
      setLoadingEnvironments(false);
      return;
    }

    setLoadingEnvironments(true);
    setPageError("");
    setNotice("");

    try {
      const response =
        await environmentService.listEnvironments(
          projectId,
          false
        );

      const list = toList(response, [
        "environments",
        "items",
        "results",
      ]);

      const names = [
        ...new Set(
          list
            .map(getEnvironmentName)
            .filter(Boolean)
        ),
      ];

      setEnvironments(names);

      setActiveEnvironment((current) => {
        if (current && names.includes(current)) {
          return current;
        }

        if (names.includes("development")) {
          return "development";
        }

        return names[0] || "";
      });
    } catch (error) {
      setEnvironments([]);
      setActiveEnvironment("");
      setVariables([]);
      setPageError(getErrorMessage(error));
    } finally {
      setLoadingEnvironments(false);
    }
  }, [projectId]);

  const loadVariables = useCallback(async () => {
    if (!projectId || !activeEnvironment) {
      setVariables([]);
      setLoadingVariables(false);
      return;
    }

    setLoadingVariables(true);
    setPageError("");

    try {
      const response =
        await environmentService.getEnvironment(
          projectId,
          activeEnvironment
        );

      const environment = unwrap(response);

      const list = toList(
        environment?.variables ??
        environment?.environment?.variables ??
        environment,
        ["variables", "items", "results"]
      );

      setVariables(
        list
          .filter((item) => item && typeof item === "object")
          .map(normalizeVariable)
      );
    } catch (error) {
      setVariables([]);
      setPageError(getErrorMessage(error));
    } finally {
      setLoadingVariables(false);
    }
  }, [projectId, activeEnvironment]);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  useEffect(() => {
    setEnvironments([]);
    setActiveEnvironment("");
    setVariables([]);
    setView("list");
    setPageError("");
    setNotice("");

    loadEnvironments();
  }, [loadEnvironments]);

  useEffect(() => {
    loadVariables();
  }, [loadVariables]);

  const openAddVariables = () => {
    setEditingDraft(null);
    setDrafts([createDraft()]);
    setDraftErrors({});
    setPageError("");
    setNotice("");
    setView("editor");
  };

  const addAnotherDraft = () => {
    setDrafts((current) => [
      ...current,
      createDraft(),
    ]);
  };

  const updateDraft = (id, field, value) => {
    setDrafts((current) =>
      current.map((draft) =>
        draft.id === id
          ? { ...draft, [field]: value }
          : draft
      )
    );

    setDraftErrors((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const removeDraft = (id) => {
    setDrafts((current) =>
      current.length === 1
        ? [createDraft()]
        : current.filter((draft) => draft.id !== id)
    );

    setDraftErrors((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const createEnvironment = async (requestedName) => {
    if (!projectId) {
      setPageError("Select a project first.");
      return;
    }

    const name = String(requestedName || "")
      .trim()
      .toLowerCase();

    if (!/^[a-z][a-z0-9_-]{1,49}$/.test(name)) {
      setPageError(
        "Use 2–50 lowercase letters, numbers, hyphens or underscores. Start with a letter."
      );
      return;
    }

    if (environments.includes(name)) {
      setPageError("This environment already exists.");
      return;
    }

    setCreatingEnvironment(true);
    setPageError("");
    setNotice("");

    try {
      await environmentService.createEnvironment({
        projectId,
        name,
      });

      setEnvironments((current) => [
        ...current,
        name,
      ]);

      setActiveEnvironment(name);
      setNewEnvironmentName("");
      setMessage(`Environment "${name}" created.`);
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setCreatingEnvironment(false);
    }
  };

  const saveVariables = async () => {
    if (!projectId || !activeEnvironment) {
      setPageError("Select a project and environment first.");
      return;
    }

    const errors = validateDrafts(drafts);
    setDraftErrors(errors);

    if (Object.keys(errors).length > 0) {
      setPageError(
        "Fix the highlighted entries before saving."
      );
      return;
    }

    const validDrafts = drafts.filter(
      (draft) => draft.key.trim()
    );

    if (validDrafts.length === 0) {
      setPageError("Add at least one variable.");
      return;
    }

    const existingKeys = new Set(
      variables.map((variable) =>
        variable.key.toLowerCase()
      )
    );

    const duplicate = validDrafts.find((draft) =>
      existingKeys.has(draft.key.trim().toLowerCase())
    );

    if (duplicate && !editingDraft) {
      setDraftErrors({
        [duplicate.id]:
          "This key already exists. Edit the existing variable instead.",
      });
      setPageError("One or more keys already exist.");
      return;
    }

    setSaving(true);
    setPageError("");
    setNotice("");

    const failed = [];
    let succeeded = 0;

    for (const draft of validDrafts) {
      const payload = {
        key: draft.key.trim(),
        value: draft.value,
        type: draft.type,
        scope: draft.scope,
        isSecret: draft.isSecret,
        required: draft.required,
        enabled: draft.enabled,
      };

      try {
        if (editingDraft) {
          await environmentService.updateVariable(
            projectId,
            activeEnvironment,
            editingDraft.key,
            payload
          );
        } else {
          await environmentService.addVariable(
            projectId,
            activeEnvironment,
            payload
          );
        }

        succeeded++;
      } catch (error) {
        failed.push({
          id: draft.id,
          key: draft.key.trim(),
          message: getErrorMessage(error),
        });
      }
    }

    setSaving(false);

    if (failed.length > 0) {
      setDraftErrors((current) => {
        const next = { ...current };

        failed.forEach((item) => {
          next[item.id] = item.message;
        });

        return next;
      });

      setPageError(
        `${succeeded} saved, ${failed.length} failed. Failed entries remain here so you can review and retry them.`
      );

      if (succeeded > 0) {
        await loadVariables();

        if (editingDraft) {
          setView("list");
          setEditingDraft(null);
        } else {
          setDrafts((current) =>
            current.filter((draft) =>
              failed.some((item) => item.id === draft.id)
            )
          );
        }
      }

      return;
    }

    await loadVariables();

    setView("list");
    setEditingDraft(null);
    setDrafts([createDraft()]);
    setDraftErrors({});
    setMessage(
      `${succeeded} variable${succeeded === 1 ? "" : "s"} saved successfully.`
    );
  };

  const openEditVariable = (variable) => {
    const draft = {
      ...createDraft(),
      key: variable.key,
      value: variable.isSecret ? "" : variable.value,
      type: variable.type || "string",
      scope: variable.scope || "project",
      isSecret: Boolean(variable.isSecret),
      required: Boolean(variable.required),
      enabled: variable.enabled !== false,
    };

    setEditingDraft({
      key: variable.key,
    });

    setDrafts([draft]);
    setDraftErrors({});
    setPageError("");
    setNotice("");
    setView("editor");
  };

  const deleteVariable = async (key) => {
    const confirmed = window.confirm(
      `Delete variable "${key}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingKey(key);
    setPageError("");
    setNotice("");

    try {
      await environmentService.deleteVariable(
        projectId,
        activeEnvironment,
        key
      );

      setVariables((current) =>
        current.filter((item) => item.key !== key)
      );

      setMessage(`Variable "${key}" deleted.`);
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setDeletingKey("");
    }
  };

  const cancelEditor = () => {
    setView("list");
    setEditingDraft(null);
    setDraftErrors({});
    setPageError("");
  };

  const refreshAll = async () => {
    await Promise.all([
      loadHealth(),
      loadEnvironments(),
    ]);
  };

  return (
    <main className={styles.panel}>
      <header className={styles.header}>
        <div className={styles.headingBlock}>
          <div className={styles.eyebrow}>
            PROJECT CONFIGURATION
          </div>

          <h1 className={styles.title}>
            Environment
          </h1>

          <p className={styles.subtitle}>
            Manage environment variables and configuration
            for your project.
          </p>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.connection}>
            <StatusDot status={serviceStatus} />
            <span>
              {serviceStatus === "connected"
                ? "Service connected"
                : serviceStatus === "checking"
                  ? "Checking service"
                  : "Service unavailable"}
            </span>
          </div>

          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={refreshAll}
            disabled={
              loadingEnvironments ||
              loadingVariables
            }
          >
            <span aria-hidden="true">↻</span>
            Refresh
          </button>
        </div>
      </header>

      {pageError && (
        <div className={styles.errorAlert} role="alert">
          <strong>Action needed</strong>
          <span>{pageError}</span>
          <button
            type="button"
            className={styles.alertClose}
            onClick={() => setPageError("")}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {notice && (
        <div className={styles.successAlert} role="status">
          <span aria-hidden="true">✓</span>
          <span>{notice}</span>
          <button
            type="button"
            className={styles.alertClose}
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}

      {!projectId ? (
        <section className={styles.emptyState}>
          <div className={styles.emptyIcon}>▦</div>
          <h2>Select a project</h2>
          <p>
            Choose a project to view and manage its
            environment variables.
          </p>

          {projects.length > 0 && (
            <select
              className={styles.select}
              value={projectId}
              onChange={onProjectChange}
              aria-label="Select project"
            >
              <option value="">Choose a project</option>
              {projects.map((project) => {
                const id = String(
                  project?.id ??
                  project?._id ??
                  project?.projectId ??
                  ""
                );

                return (
                  <option key={id} value={id}>
                    {project?.name ||
                      project?.projectName ||
                      id}
                  </option>
                );
              })}
            </select>
          )}
        </section>
      ) : (
        <>
          <section className={styles.contextBar}>
            <div className={styles.contextProject}>
              <span className={styles.contextLabel}>
                PROJECT
              </span>
              <strong>{projectName}</strong>
            </div>

            <div className={styles.environmentSelector}>
              <label
                className={styles.contextLabel}
                htmlFor="environment-select"
              >
                ENVIRONMENT
              </label>

              <select
                id="environment-select"
                className={styles.select}
                value={activeEnvironment}
                onChange={(event) => {
                  setActiveEnvironment(event.target.value);
                  setView("list");
                  setPageError("");
                  setNotice("");
                }}
                disabled={
                  loadingEnvironments ||
                  environments.length === 0
                }
              >
                {environments.length === 0 && (
                  <option value="">
                    No environments yet
                  </option>
                )}

                {environments.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {view === "editor" ? (
            <section className={styles.editor}>
              <div className={styles.editorHeader}>
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={cancelEditor}
                  disabled={saving}
                >
                  <span aria-hidden="true">←</span>
                  Back to variables
                </button>

                <div>
                  <h2>
                    {editingDraft
                      ? "Edit variable"
                      : "Add environment variables"}
                  </h2>
                  <p>
                    Add configuration entries for{" "}
                    <strong>{activeEnvironment}</strong>.
                    Values are sent to your backend only when
                    you save.
                  </p>
                </div>
              </div>

              <div className={styles.draftList}>
                {drafts.map((draft, index) => (
                  <article
                    className={styles.draftCard}
                    key={draft.id}
                  >
                    <div className={styles.draftHeading}>
                      <div className={styles.draftNumber}>
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      <h3>
                        {draft.key.trim() ||
                          `New variable ${index + 1}`}
                      </h3>

                      {!editingDraft && (
                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={() => removeDraft(draft.id)}
                          disabled={saving}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className={styles.formGrid}>
                      <div className={styles.field}>
                        <label htmlFor={`key-${draft.id}`}>
                          Variable key
                        </label>

                        <input
                          id={`key-${draft.id}`}
                          className={styles.input}
                          value={draft.key}
                          onChange={(event) =>
                            updateDraft(
                              draft.id,
                              "key",
                              event.target.value
                            )
                          }
                          placeholder="e.g. API_BASE_URL"
                          autoComplete="off"
                          spellCheck={false}
                          disabled={saving || Boolean(editingDraft)}
                        />
                      </div>

                      <div className={styles.field}>
                        <label htmlFor={`type-${draft.id}`}>
                          Value type
                        </label>

                        <select
                          id={`type-${draft.id}`}
                          className={styles.select}
                          value={draft.type}
                          onChange={(event) =>
                            updateDraft(
                              draft.id,
                              "type",
                              event.target.value
                            )
                          }
                          disabled={saving}
                        >
                          {TYPE_OPTIONS.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.fieldFull}>
                        <label htmlFor={`value-${draft.id}`}>
                          Value
                        </label>

                        <div className={styles.valueInputWrap}>
                          <textarea
                            id={`value-${draft.id}`}
                            className={styles.textarea}
                            value={draft.value}
                            onChange={(event) =>
                              updateDraft(
                                draft.id,
                                "value",
                                event.target.value
                              )
                            }
                            placeholder={
                              draft.isSecret
                                ? "Enter secret value"
                                : "Enter variable value"
                            }
                            rows={3}
                            autoComplete="off"
                            spellCheck={false}
                            disabled={saving}
                          />

                          <span className={styles.valueHint}>
                            {draft.isSecret
                              ? "Secret value"
                              : "Configuration value"}
                          </span>
                        </div>
                      </div>

                      <div className={styles.field}>
                        <label htmlFor={`scope-${draft.id}`}>
                          Scope
                        </label>

                        <select
                          id={`scope-${draft.id}`}
                          className={styles.select}
                          value={draft.scope}
                          onChange={(event) =>
                            updateDraft(
                              draft.id,
                              "scope",
                              event.target.value
                            )
                          }
                          disabled={saving}
                        >
                          {SCOPE_OPTIONS.map((scope) => (
                            <option key={scope} value={scope}>
                              {scope}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className={styles.optionsRow}>
                      <label className={styles.checkLabel}>
                        <input
                          type="checkbox"
                          checked={draft.isSecret}
                          onChange={(event) =>
                            updateDraft(
                              draft.id,
                              "isSecret",
                              event.target.checked
                            )
                          }
                          disabled={saving}
                        />
                        <span>
                          <strong>Secret</strong>
                          <small>
                            Mark this value as sensitive.
                          </small>
                        </span>
                      </label>

                      <label className={styles.checkLabel}>
                        <input
                          type="checkbox"
                          checked={draft.required}
                          onChange={(event) =>
                            updateDraft(
                              draft.id,
                              "required",
                              event.target.checked
                            )
                          }
                          disabled={saving}
                        />
                        <span>
                          <strong>Required</strong>
                          <small>
                            Flag as required configuration.
                          </small>
                        </span>
                      </label>

                      <label className={styles.checkLabel}>
                        <input
                          type="checkbox"
                          checked={draft.enabled}
                          onChange={(event) =>
                            updateDraft(
                              draft.id,
                              "enabled",
                              event.target.checked
                            )
                          }
                          disabled={saving}
                        />
                        <span>
                          <strong>Enabled</strong>
                          <small>
                            Enable this variable.
                          </small>
                        </span>
                      </label>
                    </div>

                    {draftErrors[draft.id] && (
                      <div className={styles.fieldError}>
                        {draftErrors[draft.id]}
                      </div>
                    )}
                  </article>
                ))}
              </div>

              {!editingDraft && (
                <button
                  type="button"
                  className={styles.addAnotherBtn}
                  onClick={addAnotherDraft}
                  disabled={saving}
                >
                  <span aria-hidden="true">＋</span>
                  Add another variable
                </button>
              )}

              <footer className={styles.editorFooter}>
                <span className={styles.footerHint}>
                  {drafts.length} draft
                  {drafts.length === 1 ? "" : "s"} ·
                  Blank keys will not be saved.
                </span>

                <div className={styles.footerActions}>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={cancelEditor}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={saveVariables}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className={styles.spinner} />
                        Saving…
                      </>
                    ) : (
                      <>
                        <span aria-hidden="true">✓</span>
                        Save variables
                      </>
                    )}
                  </button>
                </div>
              </footer>
            </section>
          ) : (
            <section className={styles.listSection}>
              <div className={styles.listHeader}>
                <div>
                  <h2>Environment variables</h2>
                  <p>
                    {loadingVariables
                      ? "Loading configuration…"
                      : `${variables.length} variable${
                          variables.length === 1 ? "" : "s"
                        } in ${activeEnvironment || "this environment"}`}
                  </p>
                </div>

                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={openAddVariables}
                  disabled={
                    !activeEnvironment ||
                    loadingVariables
                  }
                >
                  <span aria-hidden="true">＋</span>
                  Add variable
                </button>
              </div>

              {loadingEnvironments || loadingVariables ? (
                <div className={styles.loadingState}>
                  <span className={styles.spinnerLarge} />
                  <strong>Loading environment</strong>
                  <p>Fetching the latest configuration.</p>
                </div>
              ) : environments.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>▦</div>
                  <h2>Create your first environment</h2>
                  <p>
                    Create an environment before adding
                    configuration variables.
                  </p>

                  <div className={styles.quickActions}>
                    {QUICK_ENVIRONMENTS.map((name) => (
                      <button
                        key={name}
                        type="button"
                        className={styles.secondaryBtn}
                        onClick={() => createEnvironment(name)}
                        disabled={creatingEnvironment}
                      >
                        {creatingEnvironment
                          ? "Creating…"
                          : `+ ${name}`}
                      </button>
                    ))}
                  </div>

                  <form
                    className={styles.createForm}
                    onSubmit={(event) => {
                      event.preventDefault();
                      createEnvironment(newEnvironmentName);
                    }}
                  >
                    <input
                      className={styles.input}
                      value={newEnvironmentName}
                      onChange={(event) =>
                        setNewEnvironmentName(event.target.value)
                      }
                      placeholder="Custom environment name"
                      aria-label="Custom environment name"
                      disabled={creatingEnvironment}
                    />

                    <button
                      type="submit"
                      className={styles.primaryBtn}
                      disabled={creatingEnvironment}
                    >
                      Create
                    </button>
                  </form>
                </div>
              ) : variables.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>⌘</div>
                  <h2>No variables yet</h2>
                  <p>
                    Add the configuration your project needs.
                    You can add multiple variables in one editor.
                  </p>

                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={openAddVariables}
                  >
                    + Add your first variable
                  </button>
                </div>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.variableTable}>
                    <thead>
                      <tr>
                        <th>Variable</th>
                        <th>Value</th>
                        <th>Type / scope</th>
                        <th>Status</th>
                        <th aria-label="Actions" />
                      </tr>
                    </thead>

                    <tbody>
                      {variables.map((variable) => {
                        const key = variable.key;
                        const revealed =
                          Boolean(showValues[key]) &&
                          !variable.isSecret;

                        return (
                          <tr key={key}>
                            <td>
                              <div className={styles.variableKey}>
                                <code>{key}</code>
                                {variable.isSecret && (
                                  <span className={styles.secretBadge}>
                                    Secret
                                  </span>
                                )}
                              </div>
                            </td>

                            <td>
                              <div className={styles.valueCell}>
                                <span className={styles.valuePreview}>
                                  {variable.isSecret
                                    ? "••••••••••••"
                                    : variable.value
                                      ? revealed
                                        ? variable.value
                                        : "••••••••"
                                      : "Not provided"}
                                </span>

                                {!variable.isSecret &&
                                  variable.value && (
                                    <button
                                      type="button"
                                      className={styles.revealBtn}
                                      onClick={() =>
                                        setShowValues((current) => ({
                                          ...current,
                                          [key]: !current[key],
                                        }))
                                      }
                                    >
                                      {revealed ? "Hide" : "Show"}
                                    </button>
                                  )}
                              </div>
                            </td>

                            <td>
                              <div className={styles.metaCell}>
                                <span>{variable.type}</span>
                                <span>{variable.scope}</span>
                              </div>
                            </td>

                            <td>
                              <div className={styles.statusBadges}>
                                <span
                                  className={
                                    variable.enabled
                                      ? styles.enabledBadge
                                      : styles.disabledBadge
                                  }
                                >
                                  {variable.enabled
                                    ? "Enabled"
                                    : "Disabled"}
                                </span>

                                {variable.required && (
                                  <span className={styles.requiredBadge}>
                                    Required
                                  </span>
                                )}
                              </div>
                            </td>

                            <td>
                              <div className={styles.rowActions}>
                                <button
                                  type="button"
                                  className={styles.rowActionBtn}
                                  onClick={() =>
                                    openEditVariable(variable)
                                  }
                                  disabled={Boolean(deletingKey)}
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className={styles.deleteBtn}
                                  onClick={() =>
                                    deleteVariable(key)
                                  }
                                  disabled={
                                    deletingKey === key ||
                                    Boolean(deletingKey)
                                  }
                                >
                                  {deletingKey === key
                                    ? "Deleting…"
                                    : "Delete"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </main>
  );
}
